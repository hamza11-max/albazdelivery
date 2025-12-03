import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { emitOrderAssigned } from '@/root/lib/events'
import { OrderStatus } from '@/root/lib/constants'
import { z } from 'zod'

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

    // Validate orderId format
    try {
      z.string().cuid().parse(orderId)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, driverId: true, vendorId: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Check if order is ready for pickup
    if (order.status !== OrderStatus.READY) {
      return errorResponse(new Error(`Order is not ready for pickup. Current status: ${order.status}`), 400)
    }

    // Check if order is already assigned
    if (order.driverId) {
      throw new ConflictError('Order already assigned to another driver')
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
  emitOrderAssigned(updatedOrder, driverId)

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}

