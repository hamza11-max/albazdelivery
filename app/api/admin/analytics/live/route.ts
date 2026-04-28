/** Mirrored admin analytics live (`apps/admin`). */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { OrderStatus } from '@/generated/prisma/client'

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.ASSIGNED,
  OrderStatus.IN_DELIVERY,
]

/** Lightweight snapshot for admin polling (~real-time operational metrics). */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access analytics')
    }

    const now = new Date()
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const since1h = new Date(now.getTime() - 60 * 60 * 1000)

    const [
      ordersLast24h,
      deliveredLast24h,
      activeOrders,
      revenueAgg,
      ordersLastHour,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: since24h } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: since24h }, status: OrderStatus.DELIVERED },
      }),
      prisma.order.count({
        where: {
          status: { in: ACTIVE_ORDER_STATUSES },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: since24h },
          status: OrderStatus.DELIVERED,
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: since1h } },
      }),
    ])

    return successResponse({
      live: {
        asOf: now.toISOString(),
        ordersLast24h,
        deliveredLast24h,
        revenueLast24h: revenueAgg._sum.total ?? 0,
        activeOrders,
        ordersLastHour,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
