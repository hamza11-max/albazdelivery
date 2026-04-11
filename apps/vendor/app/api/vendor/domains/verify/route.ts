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

function canVerifyVendorDomains(session: any, targetVendorId: string): boolean {
  if (!session?.user) return false
  if (session.user.role === 'ADMIN') return true
  return session.user.role === 'VENDOR' && session.user.id === targetVendorId
}

// POST /api/vendor/domains/verify
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()

    const body = await request.json().catch(() => ({}))
    const targetVendorId = String(body?.vendorId || session.user.id)

    if (!canVerifyVendorDomains(session, targetVendorId)) {
      throw new ForbiddenError('Not allowed to verify this vendor domain')
    }

    const entitlements = await getVendorDomainEntitlements(targetVendorId)
    if (!entitlements.allowDomainWrites) {
      throw new ForbiddenError(
        `Domain verification is blocked for subscription status ${entitlements.currentStatus}.`
      )
    }

    const vendor = await (prisma.user as any).findUnique({
      where: { id: targetVendorId },
      select: {
        id: true,
        role: true,
        vendorCustomDomain: true,
        vendorDomainVerificationToken: true,
      },
    })

    if (!vendor || vendor.role !== 'VENDOR') {
      throw new ValidationError('Vendor not found')
    }
    if (!vendor.vendorCustomDomain) {
      throw new ValidationError('Vendor custom domain is not set')
    }
    if (!vendor.vendorDomainVerificationToken) {
      throw new ValidationError('Verification token is missing')
    }

    const verification = await verifyDomainOwnership(
      vendor.vendorCustomDomain,
      vendor.vendorDomainVerificationToken
    )

    if (!verification.verified) {
      await (prisma.user as any).update({
        where: { id: targetVendorId },
        data: { vendorDomainStatus: 'FAILED' },
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

    const updated = await (prisma.user as any).update({
      where: { id: targetVendorId },
      data: {
        vendorDomainStatus: 'VERIFIED',
        vendorDomainVerifiedAt: new Date(),
      },
      select: {
        id: true,
        vendorCustomDomain: true,
        vendorDomainStatus: true,
        vendorDomainVerifiedAt: true,
      },
    })

    return successResponse({
      verified: true,
      status: updated.vendorDomainStatus,
      verifiedAt: updated.vendorDomainVerifiedAt,
      customDomain: updated.vendorCustomDomain,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
