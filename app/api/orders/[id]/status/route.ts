import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated, emitOrderAssigned, emitNotificationSent } from '@/lib/events'
import { updateOrderStatusBodySchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function PUT(
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

    // Validate order ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    const body = await request.json()
    const validatedData = updateOrderStatusBodySchema.parse(body)
    const { status, driverId } = validatedData

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { 
        customer: true, 
        vendor: true,
        store: {
          select: {
            id: true,
            vendorId: true,
          },
        },
      },
    })

    if (!existingOrder) {
      throw new NotFoundError('Order')
    }

    // Verify vendorId matches store vendorId
    if (existingOrder.vendorId && existingOrder.store?.vendorId !== existingOrder.vendorId) {
      // Update vendorId from store if inconsistent
      await prisma.order.update({
        where: { id },
        data: { vendorId: existingOrder.store?.vendorId },
      })
      existingOrder.vendorId = existingOrder.store?.vendorId || existingOrder.vendorId
    }

    // Ensure order has a vendorId from store if missing
    if (!existingOrder.vendorId && existingOrder.store?.vendorId) {
      await prisma.order.update({
        where: { id },
        data: { vendorId: existingOrder.store.vendorId },
      })
      existingOrder.vendorId = existingOrder.store.vendorId
    }

    // Authorization check based on role and status transition
    const role = session.user.role
    const userId = session.user.id

    if (role === 'VENDOR') {
      // Check if vendor owns this order either directly or through the store
      const orderVendorId = existingOrder.vendorId || existingOrder.store?.vendorId
      if (orderVendorId !== userId) {
        throw new ForbiddenError('You can only update your own orders')
      }
      // Vendors can only set: ACCEPTED, PREPARING, READY, CANCELLED
      if (!['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED'].includes(status)) {
        throw new ForbiddenError('Invalid status transition for vendor')
      }
    } else if (role === 'DRIVER') {
      if (existingOrder.driverId !== userId && status !== 'ASSIGNED') {
        throw new ForbiddenError('You can only update assigned orders')
      }
      // Drivers can only set: ASSIGNED, IN_DELIVERY, DELIVERED
      if (!['ASSIGNED', 'IN_DELIVERY', 'DELIVERED'].includes(status)) {
        throw new ForbiddenError('Invalid status transition for driver')
      }
    } else if (role === 'CUSTOMER') {
      if (existingOrder.customerId !== userId) {
        throw new ForbiddenError('You can only update your own orders')
      }
      // Customers can only cancel orders
      if (status !== 'CANCELLED') {
        throw new ForbiddenError('Customers can only cancel orders')
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions')
    }

    // Validate driver assignment
    if (status === 'ASSIGNED' && driverId) {
      const driver = await prisma.user.findUnique({
        where: { id: driverId, role: 'DRIVER' },
        select: { id: true },
      })
      if (!driver) {
        return errorResponse(new Error('Driver not found'), 404)
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
      emitOrderAssigned(order, driverId)

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
  emitOrderUpdated(order)
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
  emitNotificationSent(notification)
    }

    return successResponse({ order })
  } catch (error) {
    return errorResponse(error)
  }
}
