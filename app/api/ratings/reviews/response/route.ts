import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only vendors can respond to reviews')
    }

    const body = await request.json()
    const { reviewId, response } = body

    if (!reviewId || !response) {
      return errorResponse(new Error('reviewId and response are required'), 400)
    }

    // Get review to verify vendor ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { vendorId: true, id: true },
    })

    if (!review) {
      return errorResponse(new Error('Review not found'), 404)
    }

    // Verify vendor can respond to this review
    if (session.user.role === 'VENDOR' && review.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only respond to reviews for your business')
    }

    // Check if response already exists
    const existingResponse = await prisma.vendorResponse.findUnique({
      where: { reviewId },
    })

    if (existingResponse) {
      return errorResponse(new Error('Response already exists for this review'), 400)
    }

    // Create vendor response
    const vendorResponse = await prisma.vendorResponse.create({
      data: {
        reviewId,
        response,
      },
      include: {
        review: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return successResponse({ response: vendorResponse })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { searchParams } = request.nextUrl
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return errorResponse(new Error('reviewId is required'), 400)
    }

    const response = await prisma.vendorResponse.findUnique({
      where: { reviewId },
      include: {
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
    })

    return successResponse({ response })
  } catch (error) {
    return errorResponse(error)
  }
}
