import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch AI-powered insights
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access AI insights')
    }

    const vendorId = session.user.id

    // Get date ranges
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Calculate sales
    const weekSales = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: weekAgo },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    const monthSales = await prisma.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: monthAgo },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { total: true },
    })

    const weekAmount = weekSales._sum.total || 0
    const monthAmount = monthSales._sum.total || 0

    // Simple sales forecasting
    const forecast = {
      week: weekAmount * 1.1,
      month: monthAmount * 1.15,
      trend: weekAmount > monthAmount / 4 ? 'up' : weekAmount < monthAmount / 4 ? 'down' : 'stable',
    }

    // Inventory recommendations
    const lowStockProducts = await prisma.product.findMany({
      where: {
        vendorId,
        stock: { lte: 10 },
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    })

    const recommendations = lowStockProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      recommendedQuantity: 30,
      reason: 'Stock faible - réapprovisionnement recommandé',
    }))

    // Product bundling suggestions (simplified)
    const bundles: any[] = []

    return successResponse({
      forecast,
      recommendations,
      bundles,
    })
  } catch (error) {
    console.error('[API] AI Insights error:', error)
    return errorResponse(error)
  }
}
