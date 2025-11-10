import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createRefundSchema } from '@/lib/validations/api'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = createRefundSchema.parse(body)
    const { orderId, reason, amount } = validatedData

    // Verify order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: session.user.id,
      },
      include: {
        payment: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Check if order can be refunded (not already refunded, not cancelled, etc.)
    if (order.status === 'CANCELLED') {
      return errorResponse(new Error('Cannot refund a cancelled order'), 400)
    }

    if (!order.payment) {
      return errorResponse(new Error('Order has no payment record'), 400)
    }

    // Check if refund already exists
    const existingRefund = await prisma.refund.findUnique({
      where: { orderId },
    })

    if (existingRefund) {
      return errorResponse(new Error('Refund request already exists for this order'), 400)
    }

    // Determine refund amount (use provided amount or full payment amount)
    const refundAmount = amount || order.payment.amount

    // Verify refund amount doesn't exceed payment amount
    if (refundAmount > order.payment.amount) {
      return errorResponse(new Error('Refund amount cannot exceed payment amount'), 400)
    }

    // Create refund request
    const refund = await prisma.refund.create({
      data: {
        paymentId: order.payment.id,
        orderId: order.id,
        amount: refundAmount,
        reason,
        status: 'PENDING',
      },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
          },
        },
      },
    })

    return successResponse({
      message: 'Refund request submitted successfully',
      refund,
    }, 201)
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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')

    // Build where clause based on user role
    const where: any = {}

    if (session.user.role === 'CUSTOMER') {
      // Customers can only see their own refunds
      const orders = await prisma.order.findMany({
        where: { customerId: session.user.id },
        select: { id: true },
      })
      where.orderId = {
        in: orders.map(o => o.id),
      }
    } else if (session.user.role === 'ADMIN') {
      // Admins can see all refunds
      if (status) {
        where.status = status
      }
      if (orderId) {
        where.orderId = orderId
      }
    } else {
      throw new ForbiddenError('Only customers and admins can view refunds')
    }

    // Fetch refunds
    const refunds = await prisma.refund.findMany({
      where,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ refunds })
  } catch (error) {
    console.error('[API] Refund fetch error:', error)
    return errorResponse(error)
  }
}
