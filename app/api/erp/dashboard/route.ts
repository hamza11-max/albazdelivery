import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only vendors can access their own dashboard
    if (session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access this dashboard')
    }

    const vendorId = session.user.id

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get this week's date range
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    
    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Calculate sales for different periods
    const todaySales = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    const weekSales = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: weekStart },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    const monthSales = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: monthStart },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    // Get top selling products (from order items)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: {
          vendorId,
          createdAt: { gte: monthStart },
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        vendorId,
        stock: {
          lte: 10, // Low stock threshold
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
      },
      take: 10,
    })

    return successResponse({
      todaySales: todaySales._sum.total || 0,
      weekSales: weekSales._sum.total || 0,
      monthSales: monthSales._sum.total || 0,
      topProducts: topProducts.map(p => ({
        name: p.name,
        quantity: p._sum.quantity || 0,
        orders: p._count.id,
      })),
      lowStockProducts,
    })
  } catch (error) {
    console.error('[API] Dashboard error:', error)
    return errorResponse(error)
  }
}
