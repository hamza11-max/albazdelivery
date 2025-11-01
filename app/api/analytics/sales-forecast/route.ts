import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const vendorId = request.nextUrl.searchParams.get('vendorId') || 
      (session.user.role === 'VENDOR' ? session.user.id : null)
    const period = request.nextUrl.searchParams.get('period') || 'week'

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    if (session.user.role !== 'ADMIN' && session.user.id !== vendorId) {
      throw new UnauthorizedError('Cannot access other vendor data')
    }

    // Calculate historical average
    const periodDays = period === 'week' ? 7 : 30
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - periodDays)

    const periodRevenue = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: periodStart },
  // Use string literal that matches the DB enum value to avoid depending on
  // the generated enum value export being present in the editor analysis.
  status: { in: ['DELIVERED'] },
      },
      _sum: { total: true },
      _count: true,
    })

    const totalRevenue = (periodRevenue._sum?.total as number) || 0
    const avgDailyRevenue = totalRevenue / periodDays

    // Simple forecast: assume trend continues
    const predictedRevenue = avgDailyRevenue * periodDays
    // _count may be a number or an object depending on Prisma client; normalize
    const rawCount: any = periodRevenue._count
    const orderCount = typeof rawCount === 'number' ? rawCount : (rawCount?._all || 0)
    const trend = orderCount > 0 ? 'stable' : 'down'

    return successResponse({
      forecast: {
        period,
        predictedSales: Math.round(predictedRevenue),
        confidence: 0.75,
        trend,
        avgDailyRevenue: Math.round(avgDailyRevenue),
        historicalOrders: orderCount,
      },
    })
  } catch (error) {
    console.error('[API] Forecast error:', error)
    return errorResponse(error)
  }
}
