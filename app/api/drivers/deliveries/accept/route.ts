import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderAssigned } from '@/lib/events'
import { OrderStatus } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can accept deliveries')
    }

    const body = await request.json()
    const { orderId } = body
    const driverId = session.user.id

    if (!orderId) {
      return errorResponse(new Error('orderId is required'), 400)
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return errorResponse(new Error('Order not found'), 404)
    }

    // Check if order is ready for pickup
    if (order.status !== OrderStatus.READY) {
      return errorResponse(new Error('Order is not ready for pickup'), 400)
    }

    // Check if order is already assigned
    if (order.driverId) {
      return errorResponse(new Error('Order already assigned to another driver'), 400)
    }

    // Assign driver to order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: OrderStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    console.log('[API] Driver accepted delivery:', orderId, 'by', driverId)

    // Emit event for real-time updates
    emitOrderAssigned(updatedOrder as any, driverId)

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
