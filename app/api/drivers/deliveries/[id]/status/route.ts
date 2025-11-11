import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated, emitOrderDelivered } from '@/lib/events'
import { updateOrderStatusBodySchema } from '@/lib/validations/api'
import { z } from 'zod'

// PATCH /api/drivers/deliveries/[id]/status - Update delivery status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const paramsResolved = await context.params
    const { id } = paramsResolved

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can update delivery status')
    }

    // Validate order ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    const body = await request.json()
    const validatedData = updateOrderStatusBodySchema.parse(body)
    const { status } = validatedData
    const driverId = session.user.id

    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, driverId: true, status: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Check if order is assigned to this driver
    if (order.driverId !== driverId) {
      throw new ForbiddenError('Order not assigned to this driver')
    }

    // Validate status transitions for drivers
    const allowedStatuses = ['IN_DELIVERY', 'DELIVERED']
    const normalizedStatus = status.toUpperCase()
    if (!allowedStatuses.includes(normalizedStatus)) {
      return errorResponse(new Error('Invalid status for driver. Allowed statuses: IN_DELIVERY, DELIVERED'), 400)
    }

    // Update order status
    const updateData: any = { status: normalizedStatus }
    if (normalizedStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
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

    console.log('[API] Driver updated delivery status:', id, '->', normalizedStatus)

    // Emit appropriate event
    if (normalizedStatus === 'DELIVERED') {
      emitOrderDelivered(updatedOrder)
    } else {
      emitOrderUpdated(updatedOrder)
    }

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
