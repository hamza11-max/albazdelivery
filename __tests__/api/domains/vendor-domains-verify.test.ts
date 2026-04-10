import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/root/lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/root/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))

jest.mock('@/root/lib/subscriptions/domain-entitlements', () => ({
  getVendorDomainEntitlements: jest.fn(),
}))

jest.mock('@/root/lib/domains/verification', () => ({
  verifyDomainOwnership: jest.fn(),
}))

describe('Vendor domain verification API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('blocks verification for disallowed subscription status', async () => {
    const vendorId = generateCuid()
    const { auth } = await import('@/root/lib/auth')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'PAST_DUE',
      allowDomainWrites: false,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })

    const { POST } = await import('@/app/api/vendor/domains/verify/route')
    const request = createMockRequest('http://localhost:3000/api/vendor/domains/verify', {
      method: 'POST',
      body: { vendorId },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('marks domain as FAILED when DNS checks are not ready', async () => {
    const vendorId = generateCuid()
    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')
    const { verifyDomainOwnership } = await import('@/root/lib/domains/verification')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })
    ;(prisma.user.findUnique as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      role: 'VENDOR',
      vendorCustomDomain: 'shop.vendor.com',
      vendorDomainVerificationToken: 'token123',
    })
    ;(verifyDomainOwnership as jest.Mock<any>).mockResolvedValue({
      verified: false,
      reason: 'DNS not propagated',
      txtMatched: false,
      cnameMatched: false,
    })
    ;(prisma.user.update as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      vendorDomainStatus: 'FAILED',
    })

    const { POST } = await import('@/app/api/vendor/domains/verify/route')
    const request = createMockRequest('http://localhost:3000/api/vendor/domains/verify', {
      method: 'POST',
      body: { vendorId },
    })

    const response = await POST(request)
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.verified).toBe(false)
    expect(payload.data.status).toBe('FAILED')
  })

  it('marks domain as VERIFIED when DNS checks pass', async () => {
    const vendorId = generateCuid()
    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')
    const { verifyDomainOwnership } = await import('@/root/lib/domains/verification')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })
    ;(prisma.user.findUnique as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      role: 'VENDOR',
      vendorCustomDomain: 'shop.vendor.com',
      vendorDomainVerificationToken: 'token123',
    })
    ;(verifyDomainOwnership as jest.Mock<any>).mockResolvedValue({
      verified: true,
      txtMatched: true,
      cnameMatched: true,
    })
    ;(prisma.user.update as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      vendorCustomDomain: 'shop.vendor.com',
      vendorDomainStatus: 'VERIFIED',
      vendorDomainVerifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/vendor/domains/verify/route')
    const request = createMockRequest('http://localhost:3000/api/vendor/domains/verify', {
      method: 'POST',
      body: { vendorId },
    })

    const response = await POST(request)
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.verified).toBe(true)
    expect(payload.data.status).toBe('VERIFIED')
  })
})
