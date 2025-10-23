import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const body = await request.json()
    const { reviewId, helpful } = body

    if (!reviewId || helpful === undefined) {
      return errorResponse(new Error('reviewId and helpful are required'), 400)
    }

    // Update review helpful/unhelpful count
    const review = await prisma.review.update({
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
      },
    })

    return successResponse({ review })
  } catch (error) {
    return errorResponse(error)
  }
}
