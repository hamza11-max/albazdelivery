import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

// GET /api/stores - Get all stores with optional filters
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Get authenticated user (optional for public store listing)
    const session = await auth()

    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build query
    const where: any = {
      isActive: true,
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
    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              nameAr: true,
            },
          },
        },
        orderBy: {
          rating: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

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
    return errorResponse(error)
  }
}

