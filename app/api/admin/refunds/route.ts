/** Mirrored from `apps/admin/app/api/admin/refunds/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import type { Prisma } from '@prisma/client'
import { RefundStatus } from '@prisma/client'
import { successResponse, errorResponse, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../admin/lib/csrf'
import { createRefundSchema } from '@/lib/validations/api'
import { z } from 'zod'

/** GET — list refunds (ADMIN). */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can list refunds')
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const where: Prisma.RefundWhereInput = {}

    if (status) {
      const valid: RefundStatus[] = [
        RefundStatus.PENDING,
        RefundStatus.APPROVED,
        RefundStatus.REJECTED,
        RefundStatus.COMPLETED,
      ]
      const s = status.toUpperCase() as RefundStatus
      if (valid.includes(s)) {
        where.status = s
      }
    }
    if (orderId) {
      try {
        z.string().cuid().parse(orderId)
        where.orderId = orderId
      } catch {
        return errorResponse(new Error('Invalid orderId'), 400)
      }
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [total, refunds] = await Promise.all([
      prisma.refund.count({ where }),
      prisma.refund.findMany({
        where,
        include: {
          payment: { select: { id: true, amount: true, method: true } },
          order: { select: { id: true, total: true, status: true, customerId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({
      refunds,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/** POST — admin refund creation for any order with payment. */
export async function POST(request: NextRequest) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can create refunds here')
    }

    const validatedData = createRefundSchema.parse(await request.json())
    const { orderId, reason, amount } = validatedData

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (order.status === 'CANCELLED') {
      return errorResponse(new Error('Cannot refund a cancelled order'), 400)
    }

    if (!order.payment) {
      return errorResponse(new Error('Order has no payment record'), 400)
    }

    const existingRefund = await prisma.refund.findUnique({ where: { orderId } })
    if (existingRefund) {
      return errorResponse(new Error('Refund request already exists for this order'), 400)
    }

    const refundAmount = amount ?? order.payment.amount
    if (refundAmount > order.payment.amount) {
      return errorResponse(new Error('Refund amount cannot exceed payment amount'), 400)
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId: order.payment.id,
        orderId: order.id,
        amount: refundAmount,
        reason,
        status: 'PENDING',
      },
      include: {
        payment: { select: { id: true, amount: true, method: true } },
      },
    })

    return successResponse({ message: 'Refund request created', refund }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
