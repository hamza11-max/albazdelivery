import { isFullAdmin } from '@/root/lib/admin-roles'
/** Mirrored from `apps/admin/.../orders/[orderId]/assign-driver/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { Role } from '@/generated/prisma/client'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../../../admin/lib/csrf'
import { emitOrderAssigned } from '@/lib/events'
import { z } from 'zod'

const bodySchema = z.object({
  driverId: z.string().cuid(),
})

/** Admin-only manual assign / reassign (same status rules as auto-assign flow). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (!isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can assign drivers from this endpoint')
    }

    const { orderId } = await context.params
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse(new Error(parsed.error.message), 400)
    }
    const { driverId } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true } },
        store: {
          select: {
            id: true,
            name: true,
            vendorId: true,
          },
        },
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (order.status !== 'READY' && order.status !== 'ASSIGNED') {
      return errorResponse(new Error('Order must be READY or ASSIGNED to assign a driver'), 400)
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId, role: Role.DRIVER },
    })
    if (!driver) {
      return errorResponse(new Error('Driver not found'), 404)
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true } },
        driver: {
          select: { id: true, name: true, phone: true },
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

    emitOrderAssigned(updatedOrder, driverId)

    await prisma.notification.create({
      data: {
        recipientId: driverId,
        recipientRole: Role.DRIVER,
        type: 'DELIVERY_UPDATE',
        title: 'New Delivery Assignment',
        message: `You have been assigned to deliver order #${orderId}`,
        relatedOrderId: orderId,
      },
    })

    await prisma.notification.create({
      data: {
        recipientId: order.customerId,
        recipientRole: Role.CUSTOMER,
        type: 'DELIVERY_UPDATE',
        title: 'Driver Assigned',
        message:
          order.driverId && order.driverId !== driverId
            ? 'Your order has been assigned to another driver.'
            : 'A driver has been assigned to your order.',
        relatedOrderId: orderId,
      },
    })

    return successResponse({
      order: updatedOrder,
      message: 'Driver assigned successfully',
    })
  } catch (error) {
    console.error('[admin/assign-driver]', error)
    return errorResponse(error)
  }
}
