import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { OrderStatus } from '@/lib/constants'

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
        status: OrderStatus.DELIVERED,
      },
      _sum: { total: true },
      _count: true,
    })

    // Week revenue
    const weekRevenue = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: weekStart },
        status: OrderStatus.DELIVERED,
      },
      _sum: { total: true },
    })

      // Month revenue
    const monthRevenue = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: monthStart },
        status: OrderStatus.DELIVERED,
      },
      _sum: { total: true },
    })    // Order status breakdown
    const [totalOrders, pendingCount, completedCount, cancelledCount] = await Promise.all([
      prisma.order.count({ where: { vendorId } }),
      prisma.order.count({ where: { vendorId, status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { vendorId, status: { in: [OrderStatus.DELIVERED] } } }),
      prisma.order.count({ where: { vendorId, status: OrderStatus.CANCELLED } }),
    ])

    // Top products
    const topProducts = await prisma.$queryRaw<Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
    }>>`
      SELECT 
        p.id as productId,
        p.name as productName,
        SUM(oi.quantity) as totalQuantity
      FROM "Product" p
      JOIN "OrderItem" oi ON p.id = oi.productId
      JOIN "Order" o ON o.id = oi.orderId
      WHERE o.vendorId = ${vendorId}
      AND o.status = ${OrderStatus.DELIVERED}
      GROUP BY p.id, p.name
      ORDER BY totalQuantity DESC
      LIMIT 5
    `

    interface TopProduct {
      productId: string;
      productName: string;
      totalQuantity: number | string;
    }

    const topProductsList = topProducts.map((p: TopProduct) => ({
      id: p.productId,
      name: p.productName,
      quantity: Number(p.totalQuantity) || 0,
      revenue: 0, // Can be calculated if needed
    }))

    // Average order value
    const avgOrderValue = totalOrders > 0 
      ? ((monthRevenue._sum?.total ?? 0) / totalOrders)
      : 0

    return successResponse({
      metrics: {
        todayRevenue: todayRevenue._sum?.total ?? 0,
        weekRevenue: weekRevenue._sum?.total ?? 0,
        monthRevenue: monthRevenue._sum?.total ?? 0,
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
