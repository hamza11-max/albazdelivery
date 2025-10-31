import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const { orderId, amount, reason } = await request.json()

    if (!orderId || !amount || !reason) {
      return errorResponse(new Error('orderId, amount, and reason are required'), 400)
    }

    // Verify order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: session.user.id,
      },
      include: {
        // Prisma client generates `payment` include; payment(s) plural may not exist
        payment: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // TODO: Implement refund model in schema
    // For now, return success message
    return successResponse({
      message: 'Refund request submitted successfully',
      refund: {
        orderId,
        amount,
        reason,
        status: 'PENDING',
      },
    })
  } catch (error) {
    console.error('[API] Refund creation error:', error)
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // TODO: Implement refunds retrieval when Refund model exists
    return successResponse({
      refunds: [],
      message: 'Refund system will be fully implemented soon',
    })
  } catch (error) {
    console.error('[API] Refund fetch error:', error)
    return errorResponse(error)
  }
}
