import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderAssigned } from '@/lib/events'

// GET /api/drivers/deliveries - Get available deliveries or driver's assigned deliveries
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only drivers and admins can access this endpoint
    if (session.user.role !== 'DRIVER' && session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only drivers can access deliveries')
    }

    const searchParams = request.nextUrl.searchParams
    const available = searchParams.get('available')
    const status = searchParams.get('status')

    if (available === 'true') {
      // Get orders that are ready for pickup and not assigned to any driver
      const availableOrders = await prisma.order.findMany({
        where: {
          status: 'READY',
          driverId: null,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc', // First come, first served
        },
      })

      return successResponse({ deliveries: availableOrders })
    }

    // Get orders assigned to the authenticated driver
    const where: any = {
      driverId: session.user.id,
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const driverOrders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ deliveries: driverOrders })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/drivers/deliveries - Accept a delivery (moved from /accept route)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only drivers can accept deliveries
    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can accept deliveries')
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return errorResponse(new Error('orderId is required'), 400)
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        store: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (order.status !== 'READY') {
      return errorResponse(new Error('Order is not ready for pickup'), 400)
    }

    if (order.driverId) {
      return errorResponse(new Error('Order already assigned to a driver'), 400)
    }

    // Assign driver and update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: session.user.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log('[API] Driver accepted delivery:', session.user.id, '->', orderId)

    // Emit SSE event
    emitOrderAssigned(updatedOrder as any, session.user.id)

    // Create notification for customer
    await prisma.notification.create({
      data: {
        recipientId: order.customerId,
        recipientRole: 'CUSTOMER',
        type: 'DELIVERY_UPDATE',
        title: 'Driver Assigned',
        message: `Your order has been assigned to a driver and is on the way!`,
        relatedOrderId: orderId,
      },
    })

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
