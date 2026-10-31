import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    inventoryProduct: {
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    vendorStaffMember: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => null),
}))
jest.mock('@/root/lib/auth', () => ({
  auth: jest.fn(async () => null),
}))

const mockGetSession = jest.fn()

jest.mock('@/lib/get-session-from-request', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSession(...args),
}))
jest.mock('@/root/lib/get-session-from-request', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSession(...args),
}))

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))
jest.mock('@/root/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    store: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    inventoryProduct: {
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    vendorStaffMember: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/root/lib/vendor-staff-access', () => ({
  userActsAsVendorOwner: jest.fn(async ({ actorId, vendorOwnerId }: { actorId: string; vendorOwnerId: string }) =>
    actorId === vendorOwnerId
  ),
  resolveVendorOwnerContextId: jest.fn(async (id: string) => id),
}))

describe('vendor stores + categories auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('GET store by id returns 401 without session', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('@/apps/vendor/app/api/stores/[id]/route')
    const storeId = generateCuid()
    const request = createMockRequest(`http://localhost:3001/api/stores/${storeId}`)
    const response = await GET(request, { params: { id: storeId } })
    expect(response.status).toBe(401)
  })

  it('GET store by id returns 200 for owning vendor', async () => {
    const vendorId = generateCuid()
    const storeId = generateCuid()
    const { prisma } = await import('@/root/lib/prisma')

    mockGetSession.mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR', email: 'v@x.com' },
    })
    ;(prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: storeId,
      vendorId,
      name: 'Store',
      vendor: { id: vendorId, name: 'V', phone: '0555000000' },
    })

    const { GET } = await import('@/apps/vendor/app/api/stores/[id]/route')
    const request = createMockRequest(`http://localhost:3001/api/stores/${storeId}`)
    const response = await GET(request, { params: { id: storeId } })
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.store.id).toBe(storeId)
  })

  it('GET /api/stores list returns 401 without session', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('@/apps/vendor/app/api/stores/route')
    const request = createMockRequest('http://localhost:3001/api/stores')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('GET categories returns 401 without session', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('@/lib/api-handlers/erp/categories')
    const request = createMockRequest('http://localhost:3001/api/erp/categories')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
