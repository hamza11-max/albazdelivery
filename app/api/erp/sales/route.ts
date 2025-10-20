import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch all sales (completed orders)
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access sales')
    }

    const sales = await prisma.order.findMany({
      where: {
        vendorId: session.user.id,
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return successResponse({ sales })
  } catch (error) {
    console.error('[API] Sales GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new sale (POS transaction)
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create sales')
    }

    const body = await request.json()
    const { customerId, items, subtotal, discount, total, paymentMethod } = body

    // Create order for POS sale
    const order = await prisma.order.create({
      data: {
        customerId,
        vendorId: session.user.id,
        status: 'COMPLETED',
        deliveryMethod: 'PICKUP',
        paymentMethod: paymentMethod || 'CASH',
        subtotal: parseFloat(subtotal),
        deliveryFee: 0,
        total: parseFloat(total),
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
        },
      },
      include: { items: true },
    })

    return successResponse({ sale: order })
  } catch (error) {
    console.error('[API] Sales POST error:', error)
    return errorResponse(error)
  }
}
