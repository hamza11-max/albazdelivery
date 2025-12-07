import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// GET /api/admin/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access analytics')
    }

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month'

    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()

    // Orders over time
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      },
    })

    // Group orders by time period
    const ordersByPeriod: Record<string, { count: number; revenue: number }> = {}
    
    orders.forEach((order) => {
      let key: string
      const date = new Date(order.createdAt)
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0] // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      }

      if (!ordersByPeriod[key]) {
        ordersByPeriod[key] = { count: 0, revenue: 0 }
      }
      
      ordersByPeriod[key].count++
      if (order.status === 'DELIVERED') {
        ordersByPeriod[key].revenue += order.total
      }
    })

    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Revenue by status
    const revenueByStatus = orders.reduce((acc, order) => {
      if (order.status === 'DELIVERED') {
        acc[order.status] = (acc[order.status] || 0) + order.total
      }
      return acc
    }, {} as Record<string, number>)

    // User growth
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
      },
    })

    const usersByPeriod: Record<string, { total: number; customers: number; vendors: number; drivers: number }> = {}
    
    users.forEach((user) => {
      let key: string
      const date = new Date(user.createdAt)
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!usersByPeriod[key]) {
        usersByPeriod[key] = { total: 0, customers: 0, vendors: 0, drivers: 0 }
      }
      
      usersByPeriod[key].total++
      if (user.role === 'CUSTOMER') usersByPeriod[key].customers++
      if (user.role === 'VENDOR') usersByPeriod[key].vendors++
      if (user.role === 'DRIVER') usersByPeriod[key].drivers++
    })

    // Top vendors by revenue
    const vendorOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'DELIVERED',
      },
      select: {
        vendorId: true,
        total: true,
      },
    })

    const vendorRevenue = vendorOrders.reduce((acc, order) => {
      if (order.vendorId) {
        acc[order.vendorId] = (acc[order.vendorId] || 0) + order.total
      }
      return acc
    }, {} as Record<string, number>)

    const topVendors = Object.entries(vendorRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([vendorId, revenue]) => ({ vendorId, revenue }))

    // Get vendor names
    const vendorIds = topVendors.map((v) => v.vendorId)
    const vendorDetails = await prisma.user.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true },
    })

    const topVendorsWithNames = topVendors.map((v) => {
      const vendor = vendorDetails.find((vd) => vd.id === v.vendorId)
      return {
        vendorId: v.vendorId,
        vendorName: vendor?.name || 'Unknown',
        revenue: v.revenue,
      }
    })

    // Summary statistics
    const totalRevenue = orders.filter((o) => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / orders.filter((o) => o.status === 'DELIVERED').length : 0
    const totalUsers = users.length

    return successResponse({
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalUsers,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy,
        },
      },
      ordersByPeriod: Object.entries(ordersByPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data })),
      ordersByStatus,
      revenueByStatus,
      usersByPeriod: Object.entries(usersByPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data })),
      topVendors: topVendorsWithNames,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

