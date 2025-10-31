import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated } from '@/lib/events'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access this')
    }

    const vendorId = session.user.id

    const orders = await prisma.order.findMany({
      where: { vendorId },
      include: {
        items: true,
        customer: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ orders })
  } catch (error) {
    console.error('[API] Error fetching vendor orders:', error)
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can update orders')
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return errorResponse(new Error('orderId and status are required'), 400)
    }

    const allowedStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED']
    if (!allowedStatuses.includes(status.toUpperCase())) {
      return errorResponse(new Error('Invalid status for vendor'), 400)
    }

    // Verify order belongs to vendor
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId: session.user.id,
      },
    })

    if (!order) {
      return errorResponse(new Error('Order not found'), 404)
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status.toUpperCase() },
      include: {
        items: true,
        customer: true,
      },
    })

    console.log('[API] Vendor updated order:', orderId, '->', status)
  emitOrderUpdated(updatedOrder)

    return successResponse({ order: updatedOrder })
  } catch (error) {
    console.error('[API] Error updating order:', error)
    return errorResponse(error)
  }
}
