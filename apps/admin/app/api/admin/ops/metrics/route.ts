/** Mirrored from `app/api/admin/ops/metrics/route.ts` for workspace deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import {
  successResponse,
  errorResponse,
  ForbiddenError,
  UnauthorizedError,
} from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view ops metrics')
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [webhookEvents24h, pendingRefunds, completedRefunds24h, payoutsRecorded, processedPayments24h] =
      await Promise.all([
        prisma.processedStripeWebhookEvent.count({ where: { createdAt: { gte: since } } }),
        prisma.refund.count({ where: { status: 'PENDING' } }),
        prisma.refund.count({
          where: { status: 'COMPLETED', processedAt: { gte: since } },
        }),
        prisma.vendorPayout.count(),
        prisma.payment.count({ where: { createdAt: { gte: since } } }),
      ])

    return successResponse({
      ops: {
        generatedAt: new Date().toISOString(),
        windowHours24: {
          stripeWebhookEventsAccepted: webhookEvents24h,
          paymentsCreated: processedPayments24h,
          refundsCompleted: completedRefunds24h,
        },
        refundsPending: pendingRefunds,
        vendorPayoutRowsTotal: payoutsRecorded,
        infrastructure: {
          stripeWebhookQueueMode:
            process.env.STRIPE_WEBHOOK_USE_QUEUE === '1' && Boolean(process.env.REDIS_HOST?.trim())
              ? 'queued'
              : 'inline',
          bullMqRedisConfigured: Boolean(process.env.REDIS_HOST?.trim()),
          upstashRateLimitConfigured: Boolean(
            process.env.UPSTASH_REDIS_REST_URL?.trim() &&
              process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
          ),
        },
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
