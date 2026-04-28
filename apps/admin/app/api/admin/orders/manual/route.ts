import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { Role } from '@prisma/client'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../../../lib/csrf'
import { createOrderSchema } from '@/root/lib/validations/order'
import { emitOrderCreated } from '@/root/lib/events'
import { z } from 'zod'

const manualSchema = createOrderSchema.extend({
  customerId: z.string().cuid('Invalid customer ID'),
})

/** Create order on behalf of a customer (ADMIN). */
export async function POST(request: NextRequest) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can create manual orders')
    }

    const body = manualSchema.parse(await request.json())
    const {
      customerId,
      storeId,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      deliveryAddress,
      city,
      customerPhone,
    } = body

    const [customer, store] = await Promise.all([
      prisma.user.findUnique({ where: { id: customerId } }),
      prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, vendorId: true, isActive: true },
      }),
    ])

    if (!customer || customer.role !== Role.CUSTOMER) {
      throw new NotFoundError('Customer')
    }
    if (!store || !store.isActive) {
      return errorResponse(new Error('Store not found or inactive'), 404)
    }

    const order = await prisma.order.create({
      data: {
        customerId,
        vendorId: store.vendorId,
        storeId,
        subtotal,
        deliveryFee,
        total,
        status: 'PENDING',
        paymentMethod,
        deliveryAddress,
        city,
        customerPhone,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: { select: { id: true, name: true, phone: true } },
        store: {
          select: { id: true, name: true, address: true },
        },
      },
    })

    emitOrderCreated(order)

    const pointsToAward = Math.floor(total * 0.05)
    if (pointsToAward > 0) {
      const account = await prisma.loyaltyAccount.findUnique({
        where: { customerId },
      })
      if (account) {
        await prisma.$transaction([
          prisma.loyaltyAccount.update({
            where: { id: account.id },
            data: {
              points: { increment: pointsToAward },
              totalPointsEarned: { increment: pointsToAward },
            },
          }),
          prisma.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: account.id,
              type: 'EARN',
              points: pointsToAward,
              description: `Points earned from order ${order.id} (admin)`,
              relatedOrderId: order.id,
            },
          }),
        ])
      }
    }

    return successResponse({ order }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new Error(error.message), 400)
    }
    return errorResponse(error)
  }
}
