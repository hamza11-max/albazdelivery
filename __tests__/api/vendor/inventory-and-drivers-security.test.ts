import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(async () => [{ ok: 1 }]),
    inventoryProduct: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(async () => 0),
    },
    supplier: { findFirst: jest.fn() },
    vendorStaffMember: { findUnique: jest.fn() },
    driverVendorConnection: { findMany: jest.fn() },
    subscription: { findUnique: jest.fn() },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => null),
}))

const mockGetSession = jest.fn()
const mockCheckFeatureAccess = jest.fn()

jest.mock('@/lib/get-session-from-request', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSession(...args),
}))
jest.mock('@/root/lib/get-session-from-request', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSession(...args),
}))

jest.mock('@/lib/featureGate', () => ({
  checkFeatureAccess: (...args: unknown[]) => mockCheckFeatureAccess(...args),
  checkUsageLimit: jest.fn(async () => true),
}))
jest.mock('@/root/lib/featureGate', () => ({
  checkFeatureAccess: (...args: unknown[]) => mockCheckFeatureAccess(...args),
  checkUsageLimit: jest.fn(async () => true),
}))

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))
jest.mock('@/root/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))

jest.mock('@/lib/events', () => ({
  emitNotificationSent: jest.fn(),
}))
jest.mock('@/root/lib/events', () => ({
  emitNotificationSent: jest.fn(),
}))

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(async () => [{ ok: 1 }]),
    inventoryProduct: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(async () => 0),
    },
    supplier: { findFirst: jest.fn() },
    vendorStaffMember: { findUnique: jest.fn(async () => null) },
    driverVendorConnection: { findMany: jest.fn() },
    subscription: { findUnique: jest.fn() },
  },
}))

jest.mock('@/root/lib/vendor-staff-access', () => ({
  resolveVendorOwnerContextId: jest.fn(async (id: string) => id),
  assertStaffPermission: jest.fn(async () => undefined),
  userActsAsVendorOwner: jest.fn(async () => true),
  assertVendorMayMutateInventoryCatalog: jest.fn(async () => undefined),
}))

describe('inventory + drivers security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('inventory POST without session returns 401', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('@/lib/api-handlers/erp/inventory')
    const request = createMockRequest('http://localhost:3001/api/erp/inventory', {
      method: 'POST',
      body: {
        sku: 'SKU001',
        name: 'Test',
        category: 'Food',
        costPrice: 10,
        sellingPrice: 20,
        stock: 5,
        lowStockThreshold: 1,
        vendorId: generateCuid(),
      },
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('inventory GET local- vendorId without Electron header returns 401', async () => {
    const { GET } = await import('@/lib/api-handlers/erp/inventory')
    const request = createMockRequest(
      'http://localhost:3001/api/erp/inventory?vendorId=local-offline'
    )
    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('drivers GET without fleet feature returns 403', async () => {
    const vendorId = generateCuid()
    mockGetSession.mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR', name: 'V' },
    })
    mockCheckFeatureAccess.mockResolvedValue(false)

    const { GET } = await import('@/apps/vendor/app/api/vendors/drivers/route')
    const request = createMockRequest('http://localhost:3001/api/vendors/drivers')
    const response = await GET(request)
    expect(response.status).toBe(403)
  })

  it('drivers GET with fleet feature returns 200', async () => {
    const vendorId = generateCuid()
    const { prisma } = await import('@/root/lib/prisma')

    mockGetSession.mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR', name: 'V' },
    })
    mockCheckFeatureAccess.mockResolvedValue(true)
    ;(prisma.driverVendorConnection.findMany as jest.Mock).mockResolvedValue([])

    const { GET } = await import('@/apps/vendor/app/api/vendors/drivers/route')
    const request = createMockRequest('http://localhost:3001/api/vendors/drivers')
    const response = await GET(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
