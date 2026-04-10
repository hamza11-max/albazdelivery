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
import { getVendorDomainEntitlements } from '@/root/lib/subscriptions/domain-entitlements'
import { verifyDomainOwnership } from '@/root/lib/domains/verification'

function canVerifyStoreDomain(session: any, vendorId: string): boolean {
  if (!session?.user) return false
  if (session.user.role === 'ADMIN') return true
  return session.user.role === 'VENDOR' && session.user.id === vendorId
}

// POST /api/stores/[id]/domains/verify
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()

    const storeId = params.id
    if (!storeId) throw new ValidationError('Store ID is required')

    const store = await (prisma.store as any).findUnique({
      where: { id: storeId },
      select: {
        id: true,
        vendorId: true,
        customDomain: true,
        domainVerificationToken: true,
      },
    })
    if (!store) throw new ValidationError('Store not found')

    if (!canVerifyStoreDomain(session, store.vendorId)) {
      throw new ForbiddenError('Not allowed to verify this store domain')
    }

    const entitlements = await getVendorDomainEntitlements(store.vendorId)
    if (!entitlements.allowDomainWrites) {
      throw new ForbiddenError(
        `Domain verification is blocked for subscription status ${entitlements.currentStatus}.`
      )
    }

    if (!store.customDomain) {
      throw new ValidationError('Store custom domain is not set')
    }
    if (!store.domainVerificationToken) {
      throw new ValidationError('Verification token is missing')
    }

    const verification = await verifyDomainOwnership(
      store.customDomain,
      store.domainVerificationToken
    )

    if (!verification.verified) {
      await (prisma.store as any).update({
        where: { id: store.id },
        data: { domainStatus: 'FAILED' },
      })
      return successResponse({
        verified: false,
        status: 'FAILED',
        reason: verification.reason,
        dnsChecks: {
          txtMatched: verification.txtMatched,
          cnameMatched: verification.cnameMatched,
        },
      })
    }

    const updated = await (prisma.store as any).update({
      where: { id: store.id },
      data: {
        domainStatus: 'VERIFIED',
        domainVerifiedAt: new Date(),
      },
      select: {
        id: true,
        customDomain: true,
        domainStatus: true,
        domainVerifiedAt: true,
      },
    })

    return successResponse({
      verified: true,
      status: updated.domainStatus,
      verifiedAt: updated.domainVerifiedAt,
      customDomain: updated.customDomain,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
