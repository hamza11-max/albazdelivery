import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createPackageDeliverySchema } from '@/lib/validations/order'
import { emitOrderCreated } from '@/lib/events'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = createPackageDeliverySchema.parse(body)

    const {
      packageDescription,
      recipientName,
      recipientPhone,
      deliveryAddress,
      city,
      customerPhone,
      scheduledDate,
      scheduledTime,
      whoPays,
      deliveryFee,
      paymentMethod,
    } = validatedData

    // Create package delivery order
    const order = await prisma.order.create({
      data: {
        customerId: session.user.id,
        isPackageDelivery: true,
        packageDescription,
        recipientName,
        recipientPhone,
        deliveryAddress,
        city,
        customerPhone,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTime: scheduledTime || null,
        whoPays,
        subtotal: deliveryFee,
        deliveryFee: deliveryFee,
        total: deliveryFee,
        status: 'PENDING',
        paymentMethod: paymentMethod.toUpperCase() as any,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    console.log('[API] Package delivery created:', order.id)

    // Emit order created event
    emitOrderCreated(order as any)

    // Create notification for customer
    await prisma.notification.create({
      data: {
        recipientId: session.user.id,
        recipientRole: 'CUSTOMER',
        type: 'ORDER_STATUS',
        title: 'Package Delivery Created',
        message: `Your package delivery request has been created`,
        relatedOrderId: order.id,
        actionUrl: `/tracking?orderId=${order.id}`,
      },
    })

    return successResponse({ order, message: 'Package delivery created successfully' }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
