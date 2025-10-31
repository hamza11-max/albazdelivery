import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated, emitOrderAssigned, emitNotificationSent } from '@/lib/events'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const paramsResolved = await context.params

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

  const { id } = paramsResolved
    const body = await request.json()
    const { status, driverId } = body

    if (!status) {
      return errorResponse(new Error('status is required'), 400)
    }

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, vendor: true },
    })

    if (!existingOrder) {
      return errorResponse(new Error('Order not found'), 404)
    }

    // Authorization check
    const role = session.user.role
    if (role !== 'ADMIN') {
      if (role === 'VENDOR' && existingOrder.vendorId !== session.user.id) {
        throw new ForbiddenError('You can only update your own orders')
      } else if (role === 'CUSTOMER' && existingOrder.customerId !== session.user.id) {
        throw new ForbiddenError('You can only update your own orders')
      } else if (role === 'DRIVER' && existingOrder.driverId !== session.user.id) {
        throw new ForbiddenError('You can only update assigned orders')
      }
    }

    // Prepare update data
    const normalizedStatus = status.toUpperCase()
    const updateData: any = { status: normalizedStatus }

    // Add timestamps based on status
    switch (normalizedStatus) {
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
        break
      case 'DELIVERED':
        updateData.deliveredAt = new Date()
        break
      case 'CANCELLED':
        updateData.cancelledAt = new Date()
        break
    }

    // Update order
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        customer: { select: { id: true, name: true, phone: true } },
        vendor: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true, phone: true } },
        store: true,
      },
    })

    // Create notifications
    if (normalizedStatus === 'ASSIGNED' && driverId) {
      emitOrderAssigned(order as any, driverId)

      // Notification for driver
      await prisma.notification.create({
        data: {
          recipientId: driverId,
          recipientRole: 'DRIVER',
          type: 'DELIVERY_UPDATE',
          title: 'New Delivery Assigned',
          message: `Delivery #${order.id} assigned to you`,
          relatedOrderId: order.id,
          actionUrl: `/driver?orderId=${order.id}`,
        },
      })
    } else {
      emitOrderUpdated(order as any)
    }

    // Notification for customer
    const statusMessages: Record<string, string> = {
      ACCEPTED: 'Your order has been accepted',
      PREPARING: 'Your order is being prepared',
      READY: 'Your order is ready for pickup',
      IN_DELIVERY: 'Your order is on the way',
      DELIVERED: 'Your order has been delivered',
    }

    if (statusMessages[normalizedStatus]) {
      const notification = await prisma.notification.create({
        data: {
          recipientId: order.customerId,
          recipientRole: 'CUSTOMER',
          type: 'ORDER_STATUS',
          title: 'Order Update',
          message: statusMessages[normalizedStatus],
          relatedOrderId: order.id,
          actionUrl: `/tracking?orderId=${order.id}`,
        },
      })
      emitNotificationSent(notification as any)
    }

    return successResponse({ order })
  } catch (error) {
    return errorResponse(error)
  }
}
