import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

// GET /api/stores - Get all stores with optional filters
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (may fail in edge runtime, so catch and continue)
    try {
      applyRateLimit(request, rateLimitConfigs.api)
    } catch (rateLimitError) {
      console.warn('[Stores API] Rate limit check failed:', rateLimitError)
      // Continue execution if rate limiting fails
    }

    // Get authenticated user (optional for public store listing)
    const session = await auth().catch(() => null)

    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const vendorIdParam = searchParams.get('vendorId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build query
    const where: any = {}

    // Public listing should only return active stores
    if (!vendorIdParam || !includeInactive) {
      where.isActive = true
    }

    // Vendor/admin filter
    if (vendorIdParam) {
      where.vendorId = vendorIdParam

      // Require auth to fetch by vendorId
      if (!session?.user) {
        throw new UnauthorizedError()
      }

      const isAdmin = session.user.role === 'ADMIN'
      const isVendor = session.user.role === 'VENDOR'
      const isSelf = session.user.id === vendorIdParam

      if (!isAdmin && !(isVendor && isSelf)) {
        throw new UnauthorizedError()
      }
    }

    if (categoryId) {
      const catId = parseInt(categoryId)
      if (!isNaN(catId)) {
        where.categoryId = catId
      }
    }

    if (city) {
      where.city = city
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count and stores with pagination
    // Use try-catch for each query to identify which one fails
    let total = 0
    let stores: any[] = []
    
    try {
      total = await prisma.store.count({ where })
    } catch (countError) {
      console.error('[Stores API] Count query failed:', countError)
      throw new Error('Failed to count stores')
    }
    
    try {
      stores = await prisma.store.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          // Note: category relation doesn't exist in Store model, only categoryId field
        },
        orderBy: {
          rating: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      })
    } catch (findError) {
      console.error('[Stores API] FindMany query failed:', findError)
      // Try without include to see if vendor relation is the issue
      try {
        stores = await prisma.store.findMany({
          where,
          orderBy: {
            rating: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        })
        console.warn('[Stores API] Fallback query succeeded without vendor include')
      } catch (fallbackError) {
        console.error('[Stores API] Fallback query also failed:', fallbackError)
        throw new Error('Failed to fetch stores')
      }
    }

    return successResponse({
      stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Stores API] Error:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('[Stores API] Error message:', error.message)
      console.error('[Stores API] Error stack:', error.stack)
    }
    return errorResponse(error)
  }
}

