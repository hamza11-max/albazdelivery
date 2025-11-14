import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderCreated, emitNotificationSent } from '@/lib/events'
import { createOrderSchema } from '@/lib/validations/order'
import { OrderStatus } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    const {
      storeId,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      deliveryAddress,
      city,
      customerPhone,
    } = validatedData

    // Get store and vendor info
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, vendorId: true, isActive: true },
    })

    if (!store || !store.isActive) {
      return errorResponse(new Error('Store not found or inactive'), 404)
    }

    // Normalize payment method and create order with items
    // Avoid relying on a named `PaymentMethod` export from @prisma/client here
    // (editor may not resolve generated client types). Use an inline assertion.
    const normalizedPaymentMethod = (paymentMethod?.toUpperCase() || 'CASH') as import('@prisma/client').PaymentMethod

    const order = await prisma.order.create({
      data: {
        customerId: session.user.id,
        vendorId: store.vendorId,
        subtotal,
        deliveryFee,
        total,
        status: OrderStatus.PENDING,
        paymentMethod: normalizedPaymentMethod,
        deliveryAddress,
        city,
        customerPhone,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            paymentMethod: normalizedPaymentMethod,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: { select: { id: true, name: true, phone: true } },
        store: { select: { id: true, name: true, address: true } },
      },
    })

    // Emit order created event
    emitOrderCreated(order)

    // Create vendor notification
    const vendorNotification = await prisma.notification.create({
      data: {
        recipientId: store.vendorId,
        recipientRole: 'VENDOR',
        type: 'ORDER_STATUS',
        title: 'New Order Received',
        message: `New order #${order.id} from customer`,
        relatedOrderId: order.id,
        actionUrl: `/vendor?orderId=${order.id}`,
      },
    })
    emitNotificationSent(vendorNotification)

    // Create payment record if not cash
    if (normalizedPaymentMethod !== 'CASH') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: session.user.id,
          amount: total,
          method: normalizedPaymentMethod,
          status: 'PENDING',
        },
      })
    }

    // Award loyalty points
    const pointsToAward = Math.floor(total * 0.05)
    if (pointsToAward > 0) {
      await prisma.loyaltyAccount.update({
        where: { customerId: session.user.id },
        data: {
          points: { increment: pointsToAward },
          totalPointsEarned: { increment: pointsToAward },
        },
      })

      await prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: session.user.id,
          type: 'EARN',
          points: pointsToAward,
          description: `Points earned from order ${order.id}`,
          relatedOrderId: order.id,
        },
      })
    }

    return successResponse({ order }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
