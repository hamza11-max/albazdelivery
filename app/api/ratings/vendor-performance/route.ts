import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { searchParams } = request.nextUrl
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    // Get vendor reviews
    const reviews = await prisma.review.findMany({
      where: { vendorId },
    })

    if (reviews.length === 0) {
      return successResponse({
        performance: {
          vendorId,
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      })
    }

    // Calculate metrics
    const totalReviews = reviews.length
  const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews

    // Rating distribution
    const ratingDistribution = reviews.reduce((acc: Record<number, number>, r: any) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Recent trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentReviews = reviews.filter((r: any) => r.createdAt >= thirtyDaysAgo)
    const recentAverage = recentReviews.length > 0
      ? recentReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / recentReviews.length
      : averageRating

    return successResponse({
      performance: {
        vendorId,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        recentAverage: Math.round(recentAverage * 10) / 10,
        ratingDistribution,
        trend: recentAverage > averageRating ? 'up' : recentAverage < averageRating ? 'down' : 'stable',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching vendor performance:', error)
    return errorResponse(error)
  }
}
