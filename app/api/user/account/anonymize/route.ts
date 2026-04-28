/**
 * Authenticated user requests account anonymization (GDPR-style erasure hook; irreversible for login).
 */
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { createAuditLog } from '@/lib/security/audit-log'
import { getClientInfo } from '@/lib/security/audit-client-info'
import { hashPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf

  try {
    await applyRateLimit(request, rateLimitConfigs.strict)

    const session = await auth()
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    if (String(session.user.role ?? '').toUpperCase() === 'ADMIN') {
      throw new ForbiddenError('Admin accounts cannot be anonymized via this endpoint')
    }

    const userId = session.user.id
    const token = randomUUID().replace(/-/g, '').slice(0, 16)
    const placeholderEmail = `deleted-${token}@invalid.local`
    const placeholderPhone = `000${token.slice(0, 9)}`
    const randomPwd = await hashPassword(randomUUID())

    await prisma.$transaction([
      prisma.vendorStaffMember.deleteMany({ where: { staffUserId: userId } }),
      prisma.vendorStaffMember.deleteMany({ where: { vendorOwnerId: userId } }),
      prisma.notification.deleteMany({ where: { recipientId: userId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          email: placeholderEmail,
          phone: placeholderPhone,
          name: 'Deleted user',
          password: randomPwd,
          photoUrl: null,
          address: null,
          city: null,
          licenseNumber: null,
          vendorSubdomain: null,
          vendorCustomDomain: null,
          vendorDomainStatus: 'PENDING',
          vendorDomainVerificationToken: null,
          vendorDomainVerifiedAt: null,
          storefrontLogoUrl: null,
          storefrontHeroUrl: null,
          storefrontTagline: null,
          storefrontAccentColor: null,
          storefrontWhatsappPhone: null,
          status: 'REJECTED',
        },
      }),
    ])

    const client = getClientInfo(request)
    await createAuditLog({
      userId,
      userRole: session.user.role ?? undefined,
      action: 'ACCOUNT_ANONYMIZED',
      resource: 'USER',
      resourceId: userId,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      status: 'SUCCESS',
      details: { via: 'self_service_post' },
    })

    return successResponse({
      message: 'Account anonymized; session is no longer valid for previous credentials.',
    })
  } catch (error) {
    return errorResponse(error)
  }
}
