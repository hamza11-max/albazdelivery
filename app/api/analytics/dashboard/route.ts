import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Get vendorId from query or use session user
    const vendorId = request.nextUrl.searchParams.get('vendorId') || 
      (session.user.role === 'VENDOR' ? session.user.id : null)

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    // Admin can view any vendor, vendors can only view their own
    if (session.user.role !== 'ADMIN' && session.user.id !== vendorId) {
      throw new UnauthorizedError('Cannot access other vendor data')
    }

    // Date ranges
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - 1)

    // Today's revenue
    const todayRevenue = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: todayStart, lt: todayEnd },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
      _count: true,
    })

    // Week revenue
    const weekRevenue = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: weekStart },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    // Month revenue
    const monthRevenue = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: monthStart },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    // Order status breakdown
    const [totalOrders, pendingCount, completedCount, cancelledCount] = await Promise.all([
      prisma.order.count({ where: { vendorId } }),
      prisma.order.count({ where: { vendorId, status: 'PENDING' } }),
      prisma.order.count({ where: { vendorId, status: { in: ['COMPLETED', 'DELIVERED'] } } }),
      prisma.order.count({ where: { vendorId, status: 'CANCELLED' } }),
    ])

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: {
          vendorId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    const topProductsList = topProducts.map((p) => ({
      id: p.productId,
      name: p.name,
      quantity: p._sum.quantity || 0,
      revenue: 0, // Can be calculated if needed
    }))

    // Average order value
    const avgOrderValue = totalOrders > 0 
      ? ((monthRevenue._sum.total || 0) / totalOrders)
      : 0

    return successResponse({
      metrics: {
        todayRevenue: todayRevenue._sum.total || 0,
        weekRevenue: weekRevenue._sum.total || 0,
        monthRevenue: monthRevenue._sum.total || 0,
        totalOrders,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        cancelledOrders: cancelledCount,
        avgOrderValue: Math.round(avgOrderValue),
        topProducts: topProductsList,
      },
    })
  } catch (error) {
    console.error('[API] Analytics error:', error)
    return errorResponse(error)
  }
}
