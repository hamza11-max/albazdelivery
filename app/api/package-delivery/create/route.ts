import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createPackageDeliverySchema } from '@/lib/validations/order'
import { emitOrderCreated } from '@/lib/events'
import { sendOrderPlacedCustomerEmail } from '@/lib/mail/notify-customer-transactional'

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const isDev = process.env.NODE_ENV === 'development'
    let validatedData: any
    try {
      validatedData = createPackageDeliverySchema.parse(body)
    } catch (error) {
      if (isDev) {
        validatedData = {
          packageDescription: body?.packageDescription || 'Colis démo',
          recipientName: body?.recipientName || 'Client démo',
          recipientPhone: body?.recipientPhone || '0555000000',
          deliveryAddress: body?.deliveryAddress || 'Adresse démo, Alger',
          city: body?.city || 'Alger',
          customerPhone: body?.customerPhone || '0555000000',
          scheduledDate: body?.scheduledDate,
          scheduledTime: body?.scheduledTime,
          whoPays: body?.whoPays || 'customer',
          deliveryFee: typeof body?.deliveryFee === 'number' ? body.deliveryFee : 500,
          paymentMethod: String(body?.paymentMethod || 'CASH').toUpperCase(),
        }
      } else {
        throw error
      }
    }

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
  const normalizedPaymentMethod = (paymentMethod?.toUpperCase() || 'CASH') as import('@/generated/prisma/client').PaymentMethod

    let order
    try {
      order = await prisma.order.create({
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
          paymentMethod: normalizedPaymentMethod,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      })
    } catch (error) {
      if (!isDev) throw error
      order = {
        id: `demo-pkg-${Date.now()}`,
        customerId: session.user.id,
        isPackageDelivery: true,
        packageDescription,
        recipientName,
        recipientPhone,
        deliveryAddress,
        city,
        customerPhone,
        scheduledDate,
        scheduledTime,
        whoPays,
        subtotal: deliveryFee,
        deliveryFee,
        total: deliveryFee,
        status: 'PENDING',
        paymentMethod,
        createdAt: new Date().toISOString(),
      }
    }

    console.log('[API] Package delivery created:', order.id)

    // Emit order created event
    emitOrderCreated(order)

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

    try {
      const o = order as typeof order & {
        customer?: { email?: string | null; name?: string | null } | null
      }
      const mailResult = await sendOrderPlacedCustomerEmail({
        to: o.customer?.email,
        name: o.customer?.name,
        orderId: String(o.id),
      })
      if (mailResult.ok === false) {
        console.error('[package-delivery] order_placed email failed', mailResult.error)
      }
    } catch (e) {
      console.error('[package-delivery] order_placed email error', e)
    }

    return successResponse({ order, message: 'Package delivery created successfully' }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
