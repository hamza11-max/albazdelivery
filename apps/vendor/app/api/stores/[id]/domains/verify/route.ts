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
import { getVendorDomainEntitlements } from '@/root/lib/subscriptions/domain-entitlements'
import { verifyDomainOwnership } from '@/root/lib/domains/verification'
import { addDomainToVercelProject } from '@/root/lib/domains/vercel-provisioning'

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
    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()

    const storeId = params.id
    if (!storeId) throw new ValidationError('Store ID is required')

    const store = await prisma.store.findUnique({
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
      await prisma.store.update({
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

    const updated = await prisma.store.update({
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

    let provisioning: Awaited<ReturnType<typeof addDomainToVercelProject>> | null = null
    if (updated.customDomain) {
      provisioning = await addDomainToVercelProject(updated.customDomain)
    }

    return successResponse({
      verified: true,
      status: updated.domainStatus,
      verifiedAt: updated.domainVerifiedAt,
      customDomain: updated.customDomain,
      provisioning,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
