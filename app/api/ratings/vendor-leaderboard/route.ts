import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { searchParams } = request.nextUrl
    const limit = Number.parseInt(searchParams.get('limit') || '10')

    // Get all vendors with reviews
    const vendors = await prisma.user.findMany({
      where: {
        role: 'VENDOR',
        reviews: {
          some: {},
        },
      },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    // Calculate average ratings and sort
    const vendorsWithRatings = vendors
      .map((vendor: any) => {
        const totalReviews = vendor.reviews.length
        const averageRating = totalReviews > 0
          ? vendor.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
          : 0

        return {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
        }
      })
      .sort((a: any, b: any) => {
        // Sort by rating first, then by number of reviews
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating
        }
        return b.totalReviews - a.totalReviews
      })
      .slice(0, limit)

    return successResponse({ vendors: vendorsWithRatings })
  } catch (error) {
    console.error('[API] Error fetching vendor leaderboard:', error)
    return errorResponse(error)
  }
}
