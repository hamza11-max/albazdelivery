import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated, emitOrderDelivered } from '@/lib/events'

// PATCH /api/drivers/deliveries/[id]/status - Update delivery status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can update delivery status')
    }

    const body = await request.json()
    const { status } = body
    const driverId = session.user.id

    if (!status) {
      return errorResponse(new Error('status is required'), 400)
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return errorResponse(new Error('Order not found'), 404)
    }

    // Check if order is assigned to this driver
    if (order.driverId !== driverId) {
      throw new ForbiddenError('Order not assigned to this driver')
    }

    // Validate status transitions for drivers
    const allowedStatuses = ['IN_DELIVERY', 'DELIVERED']
    const normalizedStatus = status.toUpperCase()
    if (!allowedStatuses.includes(normalizedStatus)) {
      return errorResponse(new Error('Invalid status for driver'), 400)
    }

    // Update order status
    const updateData: any = { status: normalizedStatus }
    if (normalizedStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
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
          },
        },
        store: true,
      },
    })

    console.log('[API] Driver updated delivery status:', params.id, '->', normalizedStatus)

    // Emit appropriate event
    if (normalizedStatus === 'DELIVERED') {
      emitOrderDelivered(updatedOrder as any)
    } else {
      emitOrderUpdated(updatedOrder as any)
    }

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
