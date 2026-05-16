/**
 * GET/POST /api/drivers/vendors — connection metadata & invite vs request pending
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    driverVendorConnection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))

describe('/api/drivers/vendors', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('GET includes connectionId, connectionSource, and connectionStatus per vendor', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const driverId = generateCuid()
    const vendorId = generateCuid()
    const connectionId = generateCuid()
    const storeId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'D' },
    })

    ;(prisma.user.findMany as any).mockResolvedValue([
      {
        id: vendorId,
        name: 'Vendor One',
        email: 'v@v.com',
        phone: '+1',
        photoUrl: null,
        city: 'Algiers',
        address: '1 St',
        stores: [{ id: storeId, name: 'Store', address: 'A', city: 'C' }],
      },
    ])

    ;(prisma.driverVendorConnection.findMany as any).mockResolvedValue([
      {
        id: connectionId,
        vendorId,
        status: 'PENDING',
        connectionSource: 'VENDOR_INVITED',
      },
    ])

    const { GET } = await import('@/app/api/drivers/vendors/route')
    const res = await GET(createMockRequest('http://localhost:3000/api/drivers/vendors'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.vendors).toHaveLength(1)
    expect(data.data.vendors[0]).toMatchObject({
      id: vendorId,
      connectionStatus: 'PENDING',
      connectionSource: 'VENDOR_INVITED',
      connectionId,
    })
  })

  it('POST returns 400 when pending vendor invitation must be answered in driver app', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const driverId = generateCuid()
    const vendorId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'D' },
    })
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: vendorId,
      role: 'VENDOR',
      status: 'APPROVED',
    })
    ;(prisma.driverVendorConnection.findUnique as any).mockResolvedValue({
      id: generateCuid(),
      status: 'PENDING',
      connectionSource: 'VENDOR_INVITED',
    })

    const { POST } = await import('@/app/api/drivers/vendors/route')
    const res = await POST(
      createMockRequest('http://localhost:3000/api/drivers/vendors', {
        method: 'POST',
        body: { vendorId },
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('driver dashboard')
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('POST returns 400 when driver-initiated request is already pending', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const driverId = generateCuid()
    const vendorId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'D' },
    })
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: vendorId,
      role: 'VENDOR',
      status: 'APPROVED',
    })
    ;(prisma.driverVendorConnection.findUnique as any).mockResolvedValue({
      id: generateCuid(),
      status: 'PENDING',
      connectionSource: 'DRIVER_REQUESTED',
    })

    const { POST } = await import('@/app/api/drivers/vendors/route')
    const res = await POST(
      createMockRequest('http://localhost:3000/api/drivers/vendors', {
        method: 'POST',
        body: { vendorId },
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('already pending')
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })
})
