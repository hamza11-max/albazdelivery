import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { analyticsDashboardSchema } from '@/root/lib/validations/api'
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

    // Only vendors can access their own dashboard, admins can access any       
    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {      
      throw new ForbiddenError('Only vendors and admins can access this dashboard')                                                                             
    }

    if (!vendorId) {
      try {
        const firstVendor = await prisma.user.findFirst({
          where: { role: 'VENDOR', status: 'APPROVED' },
          select: { id: true },
        })
        if (firstVendor) {
          vendorId = firstVendor.id
        }
      } catch (e) {
        console.warn('[API/dashboard] Error fetching first vendor:', e)
        // Continue without vendorId - will return empty dashboard below
      }
    }

    if (!vendorId) {
      // Return empty dashboard instead of error for dev/missing DB scenarios   
      return successResponse({
        todaySales: 0,
        weekSales: 0,
        monthSales: 0,
        topProducts: [],
        lowStockProducts: [],
      })
    }

    if (session.user.role === 'VENDOR' && session.user.id !== vendorId) {
      throw new ForbiddenError('You can only access your own dashboard')
    }

    // Verify vendor exists
    let vendor: any = null
    try {
      vendor = await prisma.user.findUnique({
        where: { id: vendorId },
        select: { id: true, role: true },
      })
    } catch (e) {
      console.warn('[API/dashboard] Error fetching vendor:', e)
    }

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
    let todaySales: any = { _sum: { total: null } }
    let weekSales: any = { _sum: { total: null } }
    let monthSales: any = { _sum: { total: null } }
    
    try {
      [todaySales, weekSales, monthSales] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            vendorId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
          _sum: { total: true },
        }),
        prisma.sale.aggregate({
          where: {
            vendorId,
            createdAt: { gte: weekStart },
          },
          _sum: { total: true },
        }),
        prisma.sale.aggregate({
          where: {
            vendorId,
            createdAt: { gte: monthStart },
          },
          _sum: { total: true },
        }),
      ])
    } catch (e) {
      console.warn('[API/dashboard] Error calculating sales:', e)
    }

    // Top selling products (from SaleItem)
    let topProductsAgg: any[] = []
    try {
      topProductsAgg = await (prisma.saleItem.groupBy as any)({
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
    } catch (e) {
      console.warn('[API/dashboard] Error fetching top products:', e)
      topProductsAgg = []
    }

    const topProducts = topProductsAgg.map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      totalSold: p._sum.quantity || 0,
    }))

    // Low stock products (from InventoryProduct)
    let lowStockProducts: any[] = []
    try {
      lowStockProducts = await prisma.inventoryProduct.findMany({
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
    } catch (e) {
      console.warn('[API/dashboard] Error fetching low stock products:', e)
      lowStockProducts = []
    }

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
