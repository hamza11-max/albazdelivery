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

    // Verify vendorId matches the order's vendor
    if (vendorId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { vendorId: true },
      })
      
      if (order && order.vendorId !== vendorId) {
        return errorResponse(new Error('Vendor ID does not match order vendor'), 400)
      }
    }

    // Verify order exists and belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        status: { in: ['DELIVERED'] },
      },
    })

    if (!order) {
      throw new NotFoundError('Order not found or not eligible for review')
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { orderId },
    })

    if (existingReview) {
      return errorResponse(new Error('Review already exists for this order'), 400)
    }

    // Get order to verify vendor
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { vendorId: true },
    })

    if (!order || !order.vendorId) {
      throw new NotFoundError('Order not found or has no vendor')
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

    const where: any = {}
    if (vendorId) where.vendorId = vendorId
    if (productId) where.order = { items: { some: { productId } } }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0

    return successResponse({ 
      reviews,
      summary: {
        totalReviews: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching reviews:', error)
    return errorResponse(error)
  }
}
