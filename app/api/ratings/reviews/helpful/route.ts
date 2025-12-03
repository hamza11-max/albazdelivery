import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { reviewHelpfulSchema } from '@/lib/validations/api'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = reviewHelpfulSchema.parse(body)
    const { reviewId, helpful } = validatedData

    // Verify review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    })

    if (!review) {
      throw new NotFoundError('Review')
    }

    // Update review helpful/unhelpful count
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(helpful
          ? { helpful: { increment: 1 } }
          : { unhelpful: { increment: 1 } }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return successResponse({ review: updatedReview })
  } catch (error) {
    return errorResponse(error)
  }
}
