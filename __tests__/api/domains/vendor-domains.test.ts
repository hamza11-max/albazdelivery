import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    store: {
      findFirst: jest.fn(),
      count: jest.fn(),
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
  calculateRemainingStoreDomains: jest.fn((max: number, used: number) => (max < 0 ? -1 : Math.max(max - used, 0))),
}))

describe('Vendor domains API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /api/vendor/domains returns 401 when unauthenticated', async () => {
    const { auth } = await import('@/root/lib/auth')
    ;(auth as jest.Mock<any>).mockResolvedValue(null)

    const { GET } = await import('@/app/api/vendor/domains/route')
    const request = createMockRequest('http://localhost:3000/api/vendor/domains')

    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('POST /api/vendor/domains blocks custom domain on STARTER', async () => {
    const vendorId = generateCuid()

    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.user.findUnique as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      role: 'VENDOR',
      vendorSubdomain: null,
      vendorCustomDomain: null,
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'STARTER',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: false,
      maxStoreCustomDomains: 0,
    })

    const { POST } = await import('@/app/api/vendor/domains/route')
    const request = createMockRequest('http://localhost:3000/api/vendor/domains', {
      method: 'POST',
      body: {
        vendorCustomDomain: 'shop.vendor.com',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('POST /api/vendor/domains returns verification records for custom domain', async () => {
    const vendorId = generateCuid()

    const { auth } = await import('@/root/lib/auth')
    const { prisma } = await import('@/root/lib/prisma')
    const { getVendorDomainEntitlements } = await import('@/root/lib/subscriptions/domain-entitlements')

    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.user.findUnique as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      role: 'VENDOR',
      vendorSubdomain: null,
      vendorCustomDomain: null,
    })
    ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue(null)
    ;(prisma.store.findFirst as jest.Mock<any>).mockResolvedValue(null)
    ;(prisma.user.update as jest.Mock<any>).mockResolvedValue({
      id: vendorId,
      vendorSubdomain: 'myvendor',
      vendorCustomDomain: 'shop.vendor.com',
      vendorDomainStatus: 'PENDING',
      vendorDomainVerifiedAt: null,
    })
    ;(prisma.store.count as jest.Mock<any>).mockResolvedValue(0)
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })

    const { POST } = await import('@/app/api/vendor/domains/route')
    const request = createMockRequest('http://localhost:3000/api/vendor/domains', {
      method: 'POST',
      body: {
        vendorSubdomain: 'myvendor',
        vendorCustomDomain: 'shop.vendor.com',
      },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.verification).toBeDefined()
    expect(Array.isArray(payload.data.verification.records)).toBe(true)
  })
})
