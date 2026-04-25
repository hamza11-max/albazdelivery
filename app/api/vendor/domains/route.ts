import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import {
  errorResponse,
  ForbiddenError,
  successResponse,
  UnauthorizedError,
  ValidationError,
} from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import {
  calculateRemainingStoreDomains,
  getVendorDomainEntitlements,
} from '@/root/lib/subscriptions/domain-entitlements'
import {
  makeVerificationToken,
  normalizeDomainInput,
  normalizeSubdomainInput,
} from '@/root/lib/domains/utils'
import { getDomainVerificationInstructions } from '@/root/lib/domains/verification'
import { removeDomainFromVercelProject } from '@/root/lib/domains/vercel-provisioning'

function canManageVendorDomains(session: any, targetVendorId: string): boolean {
  if (!session?.user) return false
  if (session.user.role === 'ADMIN') return true
  return session.user.role === 'VENDOR' && session.user.id === targetVendorId
}

async function getStoreCustomDomainCount(vendorId: string): Promise<number> {
  return prisma.store.count({
    where: {
      vendorId,
      customDomain: { not: null },
    },
  })
}

async function assertNoDomainCollisions({
  vendorId,
  vendorSubdomain,
  vendorCustomDomain,
}: {
  vendorId: string
  vendorSubdomain: string | null
  vendorCustomDomain: string | null
}) {
  if (vendorSubdomain) {
    const [sameVendorSubdomain, sameStoreSubdomain] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: { not: vendorId },
          vendorSubdomain,
        },
        select: { id: true },
      }),
      prisma.store.findFirst({
        where: { subdomain: vendorSubdomain },
        select: { id: true },
      }),
    ])
    if (sameVendorSubdomain || sameStoreSubdomain) {
      throw new ValidationError('Subdomain is already in use')
    }
  }

  if (vendorCustomDomain) {
    const [sameVendorDomain, sameStoreDomain] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: { not: vendorId },
          vendorCustomDomain,
        },
        select: { id: true },
      }),
      prisma.store.findFirst({
        where: { customDomain: vendorCustomDomain },
        select: { id: true },
      }),
    ])
    if (sameVendorDomain || sameStoreDomain) {
      throw new ValidationError('Custom domain is already in use')
    }
  }
}

// GET /api/vendor/domains
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    const targetVendorId = vendorIdParam || session.user.id
    if (!canManageVendorDomains(session, targetVendorId)) {
      throw new ForbiddenError('Not allowed to read vendor domain settings')
    }

    const [vendor, entitlements, usedStoreCustomDomains] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetVendorId },
        select: {
          id: true,
          role: true,
          vendorSubdomain: true,
          vendorCustomDomain: true,
          vendorDomainStatus: true,
          vendorDomainVerifiedAt: true,
        },
      }),
      getVendorDomainEntitlements(targetVendorId),
      getStoreCustomDomainCount(targetVendorId),
    ])

    if (!vendor || vendor.role !== 'VENDOR') {
      throw new ValidationError('Vendor not found')
    }

    return successResponse({
      vendorId: vendor.id,
      domains: {
        subdomain: vendor.vendorSubdomain,
        customDomain: vendor.vendorCustomDomain,
        status: vendor.vendorDomainStatus,
        verifiedAt: vendor.vendorDomainVerifiedAt,
      },
      subscription: {
        currentPlan: entitlements.currentPlan,
        currentStatus: entitlements.currentStatus,
        allowDomainWrites: entitlements.allowDomainWrites,
        allowVendorCustomDomain: entitlements.allowVendorCustomDomain,
        maxStoreCustomDomains: entitlements.maxStoreCustomDomains,
        usedStoreCustomDomains,
        remainingStoreDomains: calculateRemainingStoreDomains(
          entitlements.maxStoreCustomDomains,
          usedStoreCustomDomains
        ),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/vendor/domains
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()

    const body = await request.json().catch(() => ({}))
    const targetVendorId = String(body?.vendorId || session.user.id)

    if (!canManageVendorDomains(session, targetVendorId)) {
      throw new ForbiddenError('Not allowed to update vendor domain settings')
    }

    const hasSubdomain = Object.prototype.hasOwnProperty.call(body, 'vendorSubdomain')
    const hasCustomDomain = Object.prototype.hasOwnProperty.call(body, 'vendorCustomDomain')
    if (!hasSubdomain && !hasCustomDomain) {
      throw new ValidationError('Provide vendorSubdomain and/or vendorCustomDomain')
    }

    const vendor = await prisma.user.findUnique({
      where: { id: targetVendorId },
      select: {
        id: true,
        role: true,
        vendorSubdomain: true,
        vendorCustomDomain: true,
      },
    })
    if (!vendor || vendor.role !== 'VENDOR') {
      throw new ValidationError('Vendor not found')
    }

    const nextSubdomain = hasSubdomain
      ? body.vendorSubdomain === null
        ? null
        : normalizeSubdomainInput(body.vendorSubdomain)
      : vendor.vendorSubdomain
    if (hasSubdomain && body.vendorSubdomain !== null && !nextSubdomain) {
      throw new ValidationError('Invalid vendorSubdomain')
    }

    const nextCustomDomain = hasCustomDomain
      ? body.vendorCustomDomain === null
        ? null
        : normalizeDomainInput(body.vendorCustomDomain)
      : vendor.vendorCustomDomain
    if (hasCustomDomain && body.vendorCustomDomain !== null && !nextCustomDomain) {
      throw new ValidationError('Invalid vendorCustomDomain')
    }

    if (!nextSubdomain && !nextCustomDomain) {
      throw new ValidationError('At least one domain identifier must remain configured')
    }

    const entitlements = await getVendorDomainEntitlements(targetVendorId)
    if (!entitlements.allowDomainWrites) {
      throw new ForbiddenError(
        `Domain changes are blocked for subscription status ${entitlements.currentStatus}. Renew or reactivate to continue.`
      )
    }
    if (nextCustomDomain && !entitlements.allowVendorCustomDomain) {
      throw new ForbiddenError(
        `Current plan ${entitlements.currentPlan} does not include vendor custom domains. Upgrade your plan.`
      )
    }

    await assertNoDomainCollisions({
      vendorId: targetVendorId,
      vendorSubdomain: nextSubdomain,
      vendorCustomDomain: nextCustomDomain,
    })

    const requiresVerification = Boolean(nextCustomDomain)
    const verificationToken = requiresVerification ? makeVerificationToken() : null
    const now = new Date()

    const previousCustomDomain = vendor.vendorCustomDomain

    const updated = await prisma.user.update({
      where: { id: targetVendorId },
      data: {
        vendorSubdomain: nextSubdomain,
        vendorCustomDomain: nextCustomDomain,
        vendorDomainStatus: requiresVerification ? 'PENDING' : 'VERIFIED',
        vendorDomainVerificationToken: verificationToken,
        vendorDomainVerifiedAt: requiresVerification ? null : now,
      },
      select: {
        id: true,
        vendorSubdomain: true,
        vendorCustomDomain: true,
        vendorDomainStatus: true,
        vendorDomainVerifiedAt: true,
      },
    })

    // If the custom domain was removed or changed, detach the old one from Vercel.
    if (
      previousCustomDomain &&
      previousCustomDomain !== updated.vendorCustomDomain
    ) {
      await removeDomainFromVercelProject(previousCustomDomain).catch(() => null)
    }

    const usedStoreCustomDomains = await getStoreCustomDomainCount(targetVendorId)
    const response: any = {
      vendorId: updated.id,
      domains: {
        subdomain: updated.vendorSubdomain,
        customDomain: updated.vendorCustomDomain,
        status: updated.vendorDomainStatus,
        verifiedAt: updated.vendorDomainVerifiedAt,
      },
      subscription: {
        currentPlan: entitlements.currentPlan,
        currentStatus: entitlements.currentStatus,
        remainingStoreDomains: calculateRemainingStoreDomains(
          entitlements.maxStoreCustomDomains,
          usedStoreCustomDomains
        ),
      },
    }

    if (requiresVerification && updated.vendorCustomDomain && verificationToken) {
      response.verification = getDomainVerificationInstructions(
        updated.vendorCustomDomain,
        verificationToken
      )
    }

    return successResponse(response)
  } catch (error) {
    return errorResponse(error)
  }
}
