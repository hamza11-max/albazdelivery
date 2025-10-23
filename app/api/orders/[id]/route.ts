import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated } from '@/lib/events'
import { updateOrderStatusSchema } from '@/lib/validations/order'

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
            email: true,
            phone: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
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
            phone: true,
          },
        },
        payment: true,
        review: true,
      },
    })

    if (!order) {
      return errorResponse(new Error('Order not found'), 404)
    }

    // Authorization: Users can only view their own orders (except admin)
    if (session.user.role !== 'ADMIN') {
      const hasAccess =
        order.customerId === session.user.id ||
        order.vendorId === session.user.id ||
        order.driverId === session.user.id

      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this order')
      }
    }

    return successResponse({ order })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/orders/[id] - Update order status
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

    const body = await request.json()
    const { status, driverId } = updateOrderStatusSchema.parse({
      orderId: params.id,
      status,
      driverId,
    })

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!existingOrder) {
      return errorResponse(new Error('Order not found'), 404)
    }

    // Authorization based on role and status transition
    const role = session.user.role
    const userId = session.user.id

    if (role === 'VENDOR') {
      if (existingOrder.vendorId !== userId) {
        throw new ForbiddenError('You can only update your own orders')
      }
      if (!['ACCEPTED', 'PREPARING', 'READY'].includes(status)) {
        throw new ForbiddenError('Invalid status transition for vendor')
      }
    } else if (role === 'DRIVER') {
      if (existingOrder.driverId !== userId) {
        throw new ForbiddenError('You can only update assigned orders')
      }
      if (!['ASSIGNED', 'IN_DELIVERY', 'DELIVERED'].includes(status)) {
        throw new ForbiddenError('Invalid status transition for driver')
      }
    } else if (role === 'CUSTOMER') {
      if (existingOrder.customerId !== userId) {
        throw new ForbiddenError('You can only update your own orders')
      }
      if (status !== 'CANCELLED') {
        throw new ForbiddenError('Customers can only cancel orders')
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions')
    }

    // Prepare update data with timestamps
    const updateData: any = { status }

    // Add appropriate timestamp based on status
    switch (status) {
      case 'ACCEPTED':
        updateData.acceptedAt = new Date()
        break
      case 'PREPARING':
        updateData.preparingAt = new Date()
        break
      case 'READY':
        updateData.readyAt = new Date()
        break
      case 'ASSIGNED':
        updateData.assignedAt = new Date()
        if (driverId) updateData.driverId = driverId
        break
      case 'IN_DELIVERY':
        // Status is tracked via assignedAt
        break
      case 'DELIVERED':
        updateData.deliveredAt = new Date()
        break
      case 'CANCELLED':
        updateData.cancelledAt = new Date()
        break
    }

    // Update order
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

    console.log('[API] Order status updated:', updatedOrder.id, '->', status)

    // Emit SSE event
    emitOrderUpdated(updatedOrder as any)

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
