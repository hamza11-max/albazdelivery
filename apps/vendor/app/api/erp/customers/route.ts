import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

// GET - Fetch all customers who have ordered from this vendor
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
      throw new ForbiddenError('Only vendors or admins can access customers')
    }

    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const sortParam = searchParams.get('sort') // 'totalPurchases' | 'lastPurchaseDate'
    const vendorIdParam = searchParams.get('vendorId')

    let vendorId = isAdmin ? vendorIdParam : session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !vendorId) {
      try {
        const firstVendor = await prisma.user.findFirst({
          where: { role: 'VENDOR', status: 'APPROVED' },
          select: { id: true },
        })
        if (firstVendor) {
          vendorId = firstVendor.id
        }
      } catch (e) {
        console.warn('[API/customers] Error fetching first vendor:', e)
        // Continue without vendorId - will return empty results below
      }
    }

    if (!vendorId) {
      // Return empty results instead of error for dev/missing DB scenarios
      return successResponse({
        customers: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
      })
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Aggregate sales by customer
    let aggregates: any[] = []
    try {
      aggregates = await (prisma.sale.groupBy as any)({
        by: ['customerId'],
        where: { vendorId, NOT: { customerId: null } },
        _sum: { total: true },
        _max: { createdAt: true },
        _count: { id: true },
      })
    } catch (e) {
      console.warn('[API/customers] Error aggregating sales:', e)
      aggregates = []
    }

    // Sort aggregates
    if (sortParam === 'lastPurchaseDate') {
      aggregates.sort((a: any, b: any) => {
        const dateA = a._max.createdAt?.getTime() || 0
        const dateB = b._max.createdAt?.getTime() || 0
        return dateB - dateA // Most recent first
      })
    } else {
      // Default: sort by total purchases
      aggregates.sort((a: any, b: any) => {
        const totalA = a._sum.total || 0
        const totalB = b._sum.total || 0
        return totalB - totalA // Highest first
      })
    }

    // Apply pagination
    const paginatedAggregates = aggregates.slice((page - 1) * limit, page * limit)
    const customerIds = paginatedAggregates.map((a: any) => a.customerId!).filter(Boolean)

    let users: any[] = []
    try {
      users = await prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, email: true, phone: true },
      })
    } catch (e) {
      console.warn('[API/customers] Error fetching user data:', e)
      users = []
    }

    const customers = paginatedAggregates.map((a: any) => {
      const matchedUser = users.find((x: any) => x.id === a.customerId)
      return {
        id: matchedUser?.id || a.customerId!,
        name: matchedUser?.name || 'Client',
        email: matchedUser?.email || undefined,
        phone: matchedUser?.phone || '',
        totalPurchases: a._sum.total || 0,
        orderCount: a._count.id || 0,
        lastPurchaseDate: a._max.createdAt || null,
      }
    })

    return successResponse({
      customers,
      pagination: {
        page,
        limit,
        total: aggregates.length,
        pages: Math.ceil(aggregates.length / limit),
      },
    })
  } catch (error) {
    console.error('[API] Customers GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new customer (stub for future implementation)
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create customers')
    }

    // For now, return a message that customers are created through registration
    return successResponse({
      message: 'Customers are created through user registration',
    })
  } catch (error) {
    console.error('[API] Customers POST error:', error)
    return errorResponse(error)
  }
}
