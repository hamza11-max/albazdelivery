import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/root/lib/get-session-from-request'
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

function canManageStoreDomain(session: any, vendorId: string): boolean {
  if (!session?.user) return false
  if (session.user.role === 'ADMIN') return true
  return session.user.role === 'VENDOR' && session.user.id === vendorId
}

async function assertNoStoreDomainCollisions({
  storeId,
  vendorId,
  subdomain,
  customDomain,
}: {
  storeId: string
  vendorId: string
  subdomain: string | null
  customDomain: string | null
}) {
  if (subdomain) {
    const [sameStoreSubdomain, sameVendorSubdomain] = await Promise.all([
      prisma.store.findFirst({
        where: {
          id: { not: storeId },
          subdomain,
        },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: {
          id: { not: vendorId },
          vendorSubdomain: subdomain,
        },
        select: { id: true },
      }),
    ])
    if (sameStoreSubdomain || sameVendorSubdomain) {
      throw new ValidationError('Subdomain is already in use')
    }
  }

  if (customDomain) {
    const [sameStoreDomain, sameVendorDomain] = await Promise.all([
      prisma.store.findFirst({
        where: {
          id: { not: storeId },
          customDomain,
        },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: {
          vendorCustomDomain: customDomain,
        },
        select: { id: true },
      }),
    ])
    if (sameStoreDomain || sameVendorDomain) {
      throw new ValidationError('Custom domain is already in use')
    }
  }
}

// GET /api/stores/[id]/domains
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()

    const storeId = params.id
    if (!storeId) throw new ValidationError('Store ID is required')

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        vendorId: true,
        subdomain: true,
        customDomain: true,
        domainStatus: true,
        domainVerifiedAt: true,
      },
    })
    if (!store) throw new ValidationError('Store not found')

    if (!canManageStoreDomain(session, store.vendorId)) {
      throw new ForbiddenError('Not allowed to read this store domain settings')
    }

    const [entitlements, usedStoreCustomDomains] = await Promise.all([
      getVendorDomainEntitlements(store.vendorId),
      prisma.store.count({
        where: {
          vendorId: store.vendorId,
          customDomain: { not: null },
        },
      }),
    ])

    return successResponse({
      storeId: store.id,
      vendorId: store.vendorId,
      domains: {
        subdomain: store.subdomain,
        customDomain: store.customDomain,
        status: store.domainStatus,
        verifiedAt: store.domainVerifiedAt,
      },
      subscription: {
        currentPlan: entitlements.currentPlan,
        currentStatus: entitlements.currentStatus,
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

// POST /api/stores/[id]/domains
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()

    const storeId = params.id
    if (!storeId) throw new ValidationError('Store ID is required')

    const body = await request.json().catch(() => ({}))
    const hasSubdomain = Object.prototype.hasOwnProperty.call(body, 'subdomain')
    const hasCustomDomain = Object.prototype.hasOwnProperty.call(body, 'customDomain')
    if (!hasSubdomain && !hasCustomDomain) {
      throw new ValidationError('Provide subdomain and/or customDomain')
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        vendorId: true,
        subdomain: true,
        customDomain: true,
      },
    })
    if (!store) throw new ValidationError('Store not found')

    if (!canManageStoreDomain(session, store.vendorId)) {
      throw new ForbiddenError('Not allowed to update this store domain settings')
    }

    const nextSubdomain = hasSubdomain
      ? body.subdomain === null
        ? null
        : normalizeSubdomainInput(body.subdomain)
      : store.subdomain
    if (hasSubdomain && body.subdomain !== null && !nextSubdomain) {
      throw new ValidationError('Invalid subdomain')
    }

    const nextCustomDomain = hasCustomDomain
      ? body.customDomain === null
        ? null
        : normalizeDomainInput(body.customDomain)
      : store.customDomain
    if (hasCustomDomain && body.customDomain !== null && !nextCustomDomain) {
      throw new ValidationError('Invalid customDomain')
    }

    if (!nextSubdomain && !nextCustomDomain) {
      throw new ValidationError('At least one domain identifier must remain configured')
    }

    const entitlements = await getVendorDomainEntitlements(store.vendorId)
    if (!entitlements.allowDomainWrites) {
      throw new ForbiddenError(
        `Domain changes are blocked for subscription status ${entitlements.currentStatus}.`
      )
    }

    if (nextCustomDomain) {
      const usedStoreCustomDomains = await prisma.store.count({
        where: {
          vendorId: store.vendorId,
          customDomain: { not: null },
          id: { not: store.id },
        },
      })
      if (
        entitlements.maxStoreCustomDomains >= 0 &&
        usedStoreCustomDomains + 1 > entitlements.maxStoreCustomDomains
      ) {
        throw new ForbiddenError(
          `Plan ${entitlements.currentPlan} reached its custom store domain limit. Upgrade to add more domains.`
        )
      }
    }

    await assertNoStoreDomainCollisions({
      storeId: store.id,
      vendorId: store.vendorId,
      subdomain: nextSubdomain,
      customDomain: nextCustomDomain,
    })

    const requiresVerification = Boolean(nextCustomDomain)
    const verificationToken = requiresVerification ? makeVerificationToken() : null
    const now = new Date()

    const previousCustomDomain = store.customDomain

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        subdomain: nextSubdomain,
        customDomain: nextCustomDomain,
        domainStatus: requiresVerification ? 'PENDING' : 'VERIFIED',
        domainVerificationToken: verificationToken,
        domainVerifiedAt: requiresVerification ? null : now,
      },
      select: {
        id: true,
        vendorId: true,
        subdomain: true,
        customDomain: true,
        domainStatus: true,
        domainVerifiedAt: true,
      },
    })

    if (previousCustomDomain && previousCustomDomain !== updated.customDomain) {
      await removeDomainFromVercelProject(previousCustomDomain).catch(() => null)
    }

    const usedStoreCustomDomains = await prisma.store.count({
      where: {
        vendorId: store.vendorId,
        customDomain: { not: null },
      },
    })

    const response: any = {
      storeId: updated.id,
      vendorId: updated.vendorId,
      domains: {
        subdomain: updated.subdomain,
        customDomain: updated.customDomain,
        status: updated.domainStatus,
        verifiedAt: updated.domainVerifiedAt,
      },
      subscription: {
        currentPlan: entitlements.currentPlan,
        currentStatus: entitlements.currentStatus,
        maxStoreCustomDomains: entitlements.maxStoreCustomDomains,
        usedStoreCustomDomains,
        remainingStoreDomains: calculateRemainingStoreDomains(
          entitlements.maxStoreCustomDomains,
          usedStoreCustomDomains
        ),
      },
    }

    if (requiresVerification && updated.customDomain && verificationToken) {
      response.verification = getDomainVerificationInstructions(
        updated.customDomain,
        verificationToken
      )
    }

    return successResponse(response)
  } catch (error) {
    return errorResponse(error)
  }
}
