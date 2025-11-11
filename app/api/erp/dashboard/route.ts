import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { analyticsDashboardSchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const vendorIdParam = searchParams.get('vendorId')

    // Determine vendorId - vendors see their own, admins can specify
    let vendorId = session.user.role === 'VENDOR' ? session.user.id : null

    if (vendorIdParam) {
      // Validate vendorId format
      try {
        z.string().cuid().parse(vendorIdParam)
      } catch {
        return errorResponse(new Error('Invalid vendor ID format'), 400)
      }
      vendorId = vendorIdParam
    }

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    // Only vendors can access their own dashboard, admins can access any
    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only vendors and admins can access this dashboard')
    }

    if (session.user.role === 'VENDOR' && session.user.id !== vendorId) {
      throw new ForbiddenError('You can only access your own dashboard')
    }

    // Verify vendor exists
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { id: true, role: true },
    })

    if (!vendor || vendor.role !== 'VENDOR') {
      return errorResponse(new Error('Vendor not found'), 404)
    }

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

    // Calculate sales (from Sale) for different periods
    const todaySales = await prisma.sale.aggregate({
      where: {
        vendorId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { total: true },
    })

    const weekSales = await prisma.sale.aggregate({
      where: {
        vendorId,
        createdAt: { gte: weekStart },
      },
      _sum: { total: true },
    })

    const monthSales = await prisma.sale.aggregate({
      where: {
        vendorId,
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    })

    // Top selling products (from SaleItem)
    const topProductsAgg = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        sale: {
          vendorId,
          createdAt: { gte: monthStart },
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

    const topProducts = topProductsAgg.map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      totalSold: p._sum.quantity || 0,
    }))

    // Low stock products (from InventoryProduct)
    const lowStockProducts = await prisma.inventoryProduct.findMany({
      where: {
        vendorId,
        stock: {
          lte: 10,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        sellingPrice: true,
      },
      take: 10,
    })

    return successResponse({
      todaySales: todaySales._sum.total || 0,
      weekSales: weekSales._sum.total || 0,
      monthSales: monthSales._sum.total || 0,
      topProducts,
      lowStockProducts,
    })
  } catch (error) {
    console.error('[API] Dashboard error:', error)
    return errorResponse(error)
  }
}
