/** Mirrored from `app/api/admin/refunds/[id]/route.ts` for workspace deployment. */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PaymentMethod, RefundStatus } from '@prisma/client'

import { prisma } from '@/root/lib/prisma'
import { csrfProtection } from '../../../../../lib/csrf'
import {
  successResponse,
  errorResponse,
  ForbiddenError,
  NotFoundError,
} from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { stripeRefundForPaymentIntent } from '@/root/lib/stripe-refund-execute'
import {
  auditFinancialAdminAction,
  FinancialAuditActions,
} from '@/root/lib/security/financial-audit'

const patchBodySchema = z.object({
  status: z.enum(['REJECTED', 'COMPLETED']),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can update refunds')
    }

    const { id: refundId } = await context.params

    try {
      z.string().cuid().parse(refundId)
    } catch {
      return errorResponse(new Error('Invalid refund id'), 400)
    }

    const { status: nextStatus } = patchBodySchema.parse(await request.json())

    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: true,
        order: { select: { id: true, status: true } },
      },
    })

    if (!refund) {
      throw new NotFoundError('Refund')
    }

    if (nextStatus === 'REJECTED') {
      if (refund.status !== RefundStatus.PENDING) {
        return errorResponse(new Error('Only pending refunds can be rejected'), 400)
      }
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: { status: RefundStatus.REJECTED, processedAt: new Date() },
      })
      await auditFinancialAdminAction(
        FinancialAuditActions.REFUND_REJECTED,
        'REFUND',
        refundId,
        session.user.id,
        request,
        { orderId: refund.order?.id, amount: refund.amount }
      )
      return successResponse({ refund: updated })
    }

    // COMPLETED — execute refund in Stripe when applicable
    if (refund.status === RefundStatus.COMPLETED) {
      return successResponse({ message: 'Refund already completed', refund })
    }
    if (refund.status !== RefundStatus.PENDING) {
      return errorResponse(new Error('Refund cannot be completed from this state'), 400)
    }

    if (refund.stripeRefundId) {
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: { status: RefundStatus.COMPLETED, processedAt: new Date() },
      })
      await prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: 'REFUNDED' },
      })
      await auditFinancialAdminAction(
        FinancialAuditActions.REFUND_COMPLETED,
        'REFUND',
        refundId,
        session.user.id,
        request,
        {
          orderId: refund.order?.id,
          amount: refund.amount,
          via: 'existing_stripe_refund',
          stripeRefundId: refund.stripeRefundId,
        }
      )
      return successResponse({ refund: updated })
    }

    const pi =
      refund.payment.method === PaymentMethod.CARD &&
      refund.payment.transactionId?.startsWith('pi_')
        ? refund.payment.transactionId
        : null

    if (pi && process.env.STRIPE_SECRET_KEY) {
      const stripeRefund = await stripeRefundForPaymentIntent({
        paymentIntentId: pi,
        amountMajorUnits: refund.amount,
        idempotencyKey: `admin-refund-${refund.id}`,
      })

      const results = await prisma.$transaction([
        prisma.refund.update({
          where: { id: refundId },
          data: {
            status: RefundStatus.COMPLETED,
            processedAt: new Date(),
            stripeRefundId: stripeRefund.id,
          },
        }),
        prisma.payment.update({
          where: { id: refund.paymentId },
          data: { status: 'REFUNDED' },
        }),
      ])

      await auditFinancialAdminAction(
        FinancialAuditActions.REFUND_COMPLETED,
        'REFUND',
        refundId,
        session.user.id,
        request,
        {
          orderId: refund.order?.id,
          amount: refund.amount,
          via: 'stripe_payment_intent',
          stripeRefundId: stripeRefund.id,
        }
      )
      return successResponse({ refund: results[0] })
    }

    // Cash / wallet / missing Stripe: operator completion (no PSP movement)
    const results = await prisma.$transaction([
      prisma.refund.update({
        where: { id: refundId },
        data: { status: RefundStatus.COMPLETED, processedAt: new Date() },
      }),
      prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: 'REFUNDED' },
      }),
    ])

    await auditFinancialAdminAction(
      FinancialAuditActions.REFUND_COMPLETED,
      'REFUND',
      refundId,
      session.user.id,
      request,
      {
        orderId: refund.order?.id,
        amount: refund.amount,
        via: 'operator_manual',
        paymentMethod: refund.payment.method,
      }
    )
    return successResponse({ refund: results[0] })
  } catch (error) {
    return errorResponse(error)
  }
}
