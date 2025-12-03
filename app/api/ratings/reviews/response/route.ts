import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { vendorResponseSchema } from '@/lib/validations/api'

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
    const validatedData = vendorResponseSchema.parse(body)
    const { reviewId, response } = validatedData

    // Get review to verify vendor ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { vendorId: true, id: true },
    })

    if (!review) {
      throw new NotFoundError('Review')
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
      throw new ConflictError('Response already exists for this review')
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

    // Validate reviewId format
    try {
      vendorResponseSchema.pick({ reviewId: true }).parse({ reviewId })
    } catch {
      return errorResponse(new Error('Invalid review ID format'), 400)
    }

    const response = await prisma.vendorResponse.findUnique({
      where: { reviewId },
      include: {
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!response) {
      throw new NotFoundError('Vendor response')
    }

    return successResponse({ response })
  } catch (error) {
    return errorResponse(error)
  }
}
