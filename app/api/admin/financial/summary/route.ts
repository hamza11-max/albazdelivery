import { isFullAdmin } from '@/root/lib/admin-roles'
/** Mirrored from `apps/admin/app/api/admin/financial/summary/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

/** High-level totals for admin dashboard. */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || !isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can view financial summary')
    }

    const [deliveredAgg, pendingRefunds, refundAgg, orderCount] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.refund.count({ where: { status: 'PENDING' } }),
      prisma.refund.aggregate({
        where: { status: { in: ['APPROVED', 'COMPLETED'] } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.order.count(),
    ])

    return successResponse({
      summary: {
        totalOrders: orderCount,
        deliveredOrders: deliveredAgg._count.id,
        revenueDelivered: deliveredAgg._sum.total ?? 0,
        pendingRefundsCount: pendingRefunds,
        refundsRecordedCount: refundAgg._count.id,
        refundsAmountApprovedOrCompleted: refundAgg._sum.amount ?? 0,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
