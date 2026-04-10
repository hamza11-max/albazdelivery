import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    store: {
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

describe('Store domain verification API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 403 when vendor is not allowed to verify', async () => {
    const vendorId = generateCuid()
    const storeId = generateCuid()
    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.store.findUnique as jest.Mock<any>).mockResolvedValue({
      id: storeId,
      vendorId,
      customDomain: 'store.vendor.com',
      domainVerificationToken: 'token123',
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'PROFESSIONAL',
      currentStatus: 'PAST_DUE',
      allowDomainWrites: false,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 1,
    })

    const { POST } = await import('@/app/api/stores/[id]/domains/verify/route')
    const request = createMockRequest(`http://localhost:3000/api/stores/${storeId}/domains/verify`, {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: storeId } })
    expect(response.status).toBe(403)
  })

  it('marks store domain FAILED when DNS checks fail', async () => {
    const vendorId = generateCuid()
    const storeId = generateCuid()
    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')
    const { verifyDomainOwnership } = await import('@/root/lib/domains/verification')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.store.findUnique as jest.Mock<any>).mockResolvedValue({
      id: storeId,
      vendorId,
      customDomain: 'store.vendor.com',
      domainVerificationToken: 'token123',
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })
    ;(verifyDomainOwnership as jest.Mock<any>).mockResolvedValue({
      verified: false,
      reason: 'DNS not propagated',
      txtMatched: false,
      cnameMatched: false,
    })
    ;(prisma.store.update as jest.Mock<any>).mockResolvedValue({
      id: storeId,
      domainStatus: 'FAILED',
    })

    const { POST } = await import('@/app/api/stores/[id]/domains/verify/route')
    const request = createMockRequest(`http://localhost:3000/api/stores/${storeId}/domains/verify`, {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: storeId } })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('FAILED')
  })

  it('marks store domain VERIFIED when DNS checks pass', async () => {
    const vendorId = generateCuid()
    const storeId = generateCuid()
    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')
    const { verifyDomainOwnership } = await import('@/root/lib/domains/verification')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.store.findUnique as jest.Mock<any>).mockResolvedValue({
      id: storeId,
      vendorId,
      customDomain: 'store.vendor.com',
      domainVerificationToken: 'token123',
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })
    ;(verifyDomainOwnership as jest.Mock<any>).mockResolvedValue({
      verified: true,
      txtMatched: true,
      cnameMatched: true,
    })
    ;(prisma.store.update as jest.Mock<any>).mockResolvedValue({
      id: storeId,
      customDomain: 'store.vendor.com',
      domainStatus: 'VERIFIED',
      domainVerifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/stores/[id]/domains/verify/route')
    const request = createMockRequest(`http://localhost:3000/api/stores/${storeId}/domains/verify`, {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: storeId } })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('VERIFIED')
  })
})
