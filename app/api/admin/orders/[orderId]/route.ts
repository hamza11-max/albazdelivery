/** Mirrored from `apps/admin/app/api/admin/orders/[orderId]/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import {
  successResponse,
  errorResponse,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { emitOrderUpdated } from '@/lib/events'
import { z } from 'zod'

const patchBodySchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'ASSIGNED',
    'IN_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
  driverId: z.string().cuid().optional(),
})

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, price: true } } } },
  customer: { select: { id: true, name: true, email: true, phone: true } },
  vendor: { select: { id: true, name: true, email: true } },
  driver: { select: { id: true, name: true, phone: true, vehicleType: true } },
  store: { select: { id: true, name: true, address: true, city: true } },
  payment: { select: { id: true, amount: true, status: true, method: true } },
  refund: { select: { id: true, status: true, amount: true, reason: true } },
} as const

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view order detail')
    }

    const { orderId } = await context.params
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    return successResponse({ order })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
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
    if (!session?.user || String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can update orders here')
    }

    const { orderId } = await context.params
    const parsed = patchBodySchema.parse(await request.json())
    const { status, driverId } = parsed

    const existing = await prisma.order.findUnique({ where: { id: orderId } })
    if (!existing) {
      throw new NotFoundError('Order')
    }

    const updateData: Record<string, unknown> = { status }

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
        break
      case 'DELIVERED':
        updateData.deliveredAt = new Date()
        break
      case 'CANCELLED':
        updateData.cancelledAt = new Date()
        break
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData as any,
      include: orderInclude,
    })

    emitOrderUpdated(updatedOrder)
    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
