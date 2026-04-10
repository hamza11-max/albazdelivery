import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    store: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
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

describe('Store domains API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /api/stores/[id]/domains enforces plan limit', async () => {
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
      subdomain: null,
      customDomain: null,
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'PROFESSIONAL',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 1,
    })
    ;(prisma.store.count as jest.Mock<any>).mockResolvedValue(1)

    const { POST } = await import('@/app/api/stores/[id]/domains/route')
    const request = createMockRequest(`http://localhost:3000/api/stores/${storeId}/domains`, {
      method: 'POST',
      body: {
        customDomain: 'store.example.com',
      },
    })

    const response = await POST(request, { params: { id: storeId } })
    expect(response.status).toBe(403)
  })

  it('POST /api/stores/[id]/domains sets PENDING for custom domain', async () => {
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
      subdomain: null,
      customDomain: null,
    })
    ;(getVendorDomainEntitlements as jest.Mock<any>).mockResolvedValue({
      currentPlan: 'BUSINESS',
      currentStatus: 'ACTIVE',
      allowDomainWrites: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: 5,
    })
    ;(prisma.store.count as jest.Mock<any>).mockResolvedValue(0)
    ;(prisma.store.findFirst as jest.Mock<any>).mockResolvedValue(null)
    ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue(null)
    ;(prisma.store.update as jest.Mock<any>).mockResolvedValue({
      id: storeId,
      vendorId,
      subdomain: 'store-a',
      customDomain: 'storea.example.com',
      domainStatus: 'PENDING',
      domainVerifiedAt: null,
    })

    const { POST } = await import('@/app/api/stores/[id]/domains/route')
    const request = createMockRequest(`http://localhost:3000/api/stores/${storeId}/domains`, {
      method: 'POST',
      body: {
        subdomain: 'store-a',
        customDomain: 'storea.example.com',
      },
    })

    const response = await POST(request, { params: { id: storeId } })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.domains.status).toBe('PENDING')
    expect(payload.data.verification).toBeDefined()
  })
})
