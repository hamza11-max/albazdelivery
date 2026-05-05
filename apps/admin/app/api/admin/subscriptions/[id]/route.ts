import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { SubscriptionPlan, SubscriptionStatus } from '@/generated/prisma/client'
import { isFullAdmin } from '@/root/lib/admin-roles'
import { csrfProtection } from '../../../../../lib/csrf'
import { PLAN_FEATURES } from '@/root/lib/subscription-plans'
import { resolveVendorEntitlements } from '@/root/lib/subscriptions/resolve-entitlements'

// GET /api/admin/subscriptions/[id] — subscription detail for admin UI
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!isFullAdmin(session.user?.role)) {
      throw new ForbiddenError('Only admins can access subscription detail')
    }

    const { id } = await context.params
    if (!id) return errorResponse(new Error('Subscription ID required'), 400)

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        usage: true,
        subscriptionPayments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
    if (!subscription) throw new NotFoundError('Subscription')

    const planBaseline =
      PLAN_FEATURES[subscription.plan] ?? PLAN_FEATURES.STARTER

    const effectiveEntitlements = resolveVendorEntitlements({
      plan: subscription.plan,
      status: subscription.status,
      featureOverrides: subscription.featureOverrides,
    })

    return successResponse({
      subscription,
      planBaseline,
      effectiveEntitlements,
      featureOverrides: subscription.featureOverrides,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/admin/subscriptions/[id] - Extend or update subscription (admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!isFullAdmin(session.user?.role)) {
      throw new ForbiddenError('Only admins can update subscriptions')
    }

    const { id } = await context.params
    if (!id) return errorResponse(new Error('Subscription ID required'), 400)

    const body = await request.json().catch(() => ({}))
    const { extendDays, plan, status } = body || {}

    const existing = await prisma.subscription.findUnique({
      where: { id },
      select: { id: true, currentPeriodEnd: true, plan: true, status: true },
    })
    if (!existing) throw new NotFoundError('Subscription')

    const updates: {
      currentPeriodEnd?: Date
      plan?: SubscriptionPlan
      status?: SubscriptionStatus
    } = {}

    if (typeof extendDays === 'number' && extendDays > 0) {
      const from =
        new Date(existing.currentPeriodEnd).getTime() > Date.now()
          ? new Date(existing.currentPeriodEnd)
          : new Date()
      updates.currentPeriodEnd = new Date(from.getTime() + extendDays * 24 * 60 * 60 * 1000)
    }

    if (
      plan &&
      ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'].includes(String(plan).toUpperCase())
    ) {
      updates.plan = String(plan).toUpperCase() as SubscriptionPlan
    }

    if (
      status &&
      ['ACTIVE', 'TRIAL', 'CANCELLED', 'EXPIRED', 'PAST_DUE'].includes(String(status).toUpperCase())
    ) {
      updates.status = String(status).toUpperCase() as SubscriptionStatus
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(
        new Error('No valid updates (extendDays, plan, or status required)'),
        400
      )
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updates,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return successResponse({ subscription: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
