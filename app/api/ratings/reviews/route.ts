import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'
import { createReviewSchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'CUSTOMER') {
      throw new UnauthorizedError('Only customers can create reviews')
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)
    const { orderId, rating, comment, vendorId } = validatedData
    const customerId = session.user.id

    // Verify order exists and belongs to customer, and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        status: { in: ['DELIVERED'] },
      },
      select: {
        id: true,
        vendorId: true,
        status: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order not found or not eligible for review')
    }

    // Verify vendorId matches the order's vendor if provided
    if (vendorId && order.vendorId !== vendorId) {
      return errorResponse(new Error('Vendor ID does not match order vendor'), 400)
    }

    if (!order.vendorId) {
      throw new NotFoundError('Order has no vendor')
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { orderId },
    })

    if (existingReview) {
      return errorResponse(new Error('Review already exists for this order'), 400)
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId,
        customerId,
        vendorId: vendorId || order.vendorId,
        rating,
        comment: validatedData.comment,
        foodQuality: validatedData.foodQuality || null,
        deliveryTime: validatedData.deliveryTime || null,
        customerService: validatedData.customerService || null,
        photos: validatedData.photos || [],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return successResponse({ review })
  } catch (error) {
    console.error('[API] Error creating review:', error)
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { searchParams } = request.nextUrl
    const vendorId = searchParams.get('vendorId')
    const productId = searchParams.get('productId')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const minRatingParam = searchParams.get('minRating')

    // Validate query parameters
    if (!vendorId && !productId) {
      return errorResponse(new Error('vendorId or productId is required'), 400)
    }

    // Validate format if provided
    if (vendorId) {
      try {
        z.string().cuid().parse(vendorId)
      } catch {
        return errorResponse(new Error('Invalid vendorId format'), 400)
      }
    }

    if (productId) {
      try {
        z.string().cuid().parse(productId)
      } catch {
        return errorResponse(new Error('Invalid productId format'), 400)
      }
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '20')), 100)

    // Validate minRating if provided
    let minRating: number | undefined
    if (minRatingParam) {
      minRating = parseFloat(minRatingParam)
      if (isNaN(minRating) || minRating < 1 || minRating > 5) {
        return errorResponse(new Error('minRating must be between 1 and 5'), 400)
      }
    }

    const where: any = {}
    if (vendorId) where.vendorId = vendorId
    if (productId) where.order = { items: { some: { productId } } }
    if (minRating !== undefined) where.rating = { gte: minRating }

    // Get total count and reviews with pagination
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          order: {
            select: {
              id: true,
              createdAt: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // Calculate average rating from all reviews (not just current page)
    const avgRatingResult = await prisma.review.aggregate({
      where,
      _avg: {
        rating: true,
      },
    })

    const avgRating = avgRatingResult._avg.rating || 0

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: {
        rating: true,
      },
    })

    return successResponse({ 
      reviews,
      summary: {
        totalReviews: total,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution: ratingDistribution.reduce((acc: any, item: any) => {
          acc[item.rating] = item._count.rating
          return acc
        }, {}),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Error fetching reviews:', error)
    return errorResponse(error)
  }
}
