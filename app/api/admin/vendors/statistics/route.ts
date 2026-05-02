import { isFullAdmin } from '@/root/lib/admin-roles'
/** Mirrored from `apps/admin/app/api/admin/vendors/statistics/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { Role } from '@/generated/prisma/client'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

/** Aggregate order & store counts per vendor (ADMIN). */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (!isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can view vendor statistics')
    }

    const vendors = await prisma.user.findMany({
      where: { role: Role.VENDOR },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    const [orderRows, deliveredRows, storeRows] = await Promise.all([
      prisma.order.groupBy({
        by: ['vendorId'],
        where: { vendorId: { not: null } },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['vendorId'],
        where: { vendorId: { not: null }, status: 'DELIVERED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.store.groupBy({
        by: ['vendorId'],
        _count: { id: true },
      }),
    ])

    const orderMap = Object.fromEntries(
      orderRows.filter((r) => r.vendorId).map((r) => [r.vendorId!, { count: r._count.id }])
    )
    const deliveredMap = Object.fromEntries(
      deliveredRows.filter((r) => r.vendorId).map((r) => [
        r.vendorId!,
        {
          revenue: r._sum.total ?? 0,
          deliveredOrders: r._count.id,
        },
      ])
    )
    const storeMap = Object.fromEntries(storeRows.map((r) => [r.vendorId, r._count.id]))

    const rows = vendors.map((v) => ({
      vendor: v,
      ordersCount: orderMap[v.id]?.count ?? 0,
      revenueDelivered: deliveredMap[v.id]?.revenue ?? 0,
      deliveredOrders: deliveredMap[v.id]?.deliveredOrders ?? 0,
      storesCount: storeMap[v.id] ?? 0,
    }))

    return successResponse({ statistics: rows })
  } catch (error) {
    return errorResponse(error)
  }
}
