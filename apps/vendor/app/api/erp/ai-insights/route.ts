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
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new UnauthorizedError('Only vendors or admins can access AI insights')
    }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    const vendorId = isAdmin ? vendorIdParam : session.user.id

    if (!vendorId) {
      return errorResponse(new Error('vendorId query parameter is required for admin access'), 400)
    }

    // Get date ranges
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Calculate sales (from Sale)
    const weekSales = await prisma.sale.aggregate({
      where: {
        vendorId,
        createdAt: { gte: weekAgo },
      },
      _sum: { total: true },
    })

    const monthSales = await prisma.sale.aggregate({
      where: {
        vendorId,
        createdAt: { gte: monthAgo },
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
    const lowStockProducts = await prisma.inventoryProduct.findMany({
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

    const recommendations = lowStockProducts.map((product: any) => ({
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
