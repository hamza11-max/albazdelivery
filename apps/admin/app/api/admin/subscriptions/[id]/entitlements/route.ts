import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import {
  successResponse,
  errorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/root/lib/errors'
import { isFullAdmin } from '@/root/lib/admin-roles'
import { csrfProtection } from '@/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { resolveVendorEntitlements } from '@/root/lib/subscriptions/resolve-entitlements'
import {
  featureOverridesPatchSchema,
  mergeFeatureOverridesJson,
} from '@/root/lib/subscriptions/feature-overrides-zod'

// PATCH /api/admin/subscriptions/[id]/entitlements — merge feature overrides (admin only)
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
      throw new ForbiddenError('Only admins can update subscription entitlements')
    }

    const { id } = await context.params
    if (!id) return errorResponse(new Error('Subscription ID required'), 400)

    const existing = await prisma.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        featureOverrides: true,
        plan: true,
        status: true,
        userId: true,
      },
    })
    if (!existing) throw new NotFoundError('Subscription')

    const body = await request.json().catch(() => ({}))
    const parsed = featureOverridesPatchSchema.safeParse(body || {})
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((e) => e.message).join('; ') || 'Invalid body')
    }
    if (Object.keys(parsed.data).length === 0) {
      return errorResponse(new Error('Provide at least one entitlement field'), 400)
    }

    const before = existing.featureOverrides
    const merged = mergeFeatureOverridesJson(existing.featureOverrides, parsed.data)

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        featureOverrides: merged as object,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        usage: true,
      },
    })

    await createAuditLog(
      {
        userId: session.user.id,
        userRole: session.user.role ?? undefined,
        action: AuditActions.SUBSCRIPTION_ENTITLEMENTS_UPDATED,
        resource: AuditResources.SUBSCRIPTION,
        resourceId: id,
        details: { before, after: merged },
        status: 'SUCCESS',
      },
      request
    )

    const effectiveEntitlements = resolveVendorEntitlements({
      plan: updated.plan,
      status: updated.status,
      featureOverrides: updated.featureOverrides,
    })

    return successResponse({
      subscription: updated,
      featureOverrides: merged,
      effectiveEntitlements,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
