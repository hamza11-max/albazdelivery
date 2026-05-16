/**
 * PATCH /api/vendors/orders — status, driver assignment, fleet gate
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    driverVendorConnection: {
      findFirst: jest.fn(),
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

jest.mock('@/lib/events', () => ({
  emitOrderUpdated: jest.fn(),
}))

jest.mock('@/lib/featureGate', () => ({
  checkFeatureAccess: jest.fn(),
}))

describe('PATCH /api/vendors/orders', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('updates driver only when fleet feature is on and driver link is accepted + dispatchable', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { checkFeatureAccess } = await import('@/lib/featureGate')
    const { emitOrderUpdated } = await import('@/lib/events')

    const vendorId = generateCuid()
    const orderId = generateCuid()
    const driverId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.order.findFirst as any).mockResolvedValue({
      id: orderId,
      status: 'READY',
      vendorId,
    })
    ;(checkFeatureAccess as any).mockResolvedValue(true)
    ;(prisma.driverVendorConnection.findFirst as any).mockResolvedValue({ id: generateCuid() })

    const updated = {
      id: orderId,
      vendorId,
      driverId,
      status: 'READY',
      items: [],
      customer: { id: generateCuid(), name: 'C', phone: '1', email: 'e@e.com' },
      vendor: { id: vendorId, name: 'V' },
      driver: { id: driverId, name: 'D', phone: '2' },
      store: { id: generateCuid(), name: 'S', address: 'A' },
    }
    ;(prisma.order.update as any).mockResolvedValue(updated)

    const { PATCH } = await import('@/app/api/vendors/orders/route')
    const req = createMockRequest('http://localhost:3000/api/vendors/orders', {
      method: 'PATCH',
      body: { orderId, driverId },
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.order.driverId).toBe(driverId)
    expect(checkFeatureAccess).toHaveBeenCalledWith(vendorId, 'driverFleetManagement')
    expect(prisma.driverVendorConnection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vendorId,
          driverId,
          status: 'ACCEPTED',
          availableForDispatch: true,
        }),
      }),
    )
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: orderId },
        data: expect.objectContaining({
          driverId,
          assignedAt: expect.any(Date),
        }),
      }),
    )
    expect(emitOrderUpdated).toHaveBeenCalledWith(updated)
  })

  it('rejects driver assignment when fleet feature is off', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { checkFeatureAccess } = await import('@/lib/featureGate')

    const vendorId = generateCuid()
    const orderId = generateCuid()
    const driverId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.order.findFirst as any).mockResolvedValue({
      id: orderId,
      status: 'READY',
      vendorId,
    })
    ;(checkFeatureAccess as any).mockResolvedValue(false)

    const { PATCH } = await import('@/app/api/vendors/orders/route')
    const req = createMockRequest('http://localhost:3000/api/vendors/orders', {
      method: 'PATCH',
      body: { orderId, driverId },
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.success).toBe(false)
    expect(prisma.driverVendorConnection.findFirst).not.toHaveBeenCalled()
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  it('rejects driver assignment when no accepted dispatchable link exists', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { checkFeatureAccess } = await import('@/lib/featureGate')

    const vendorId = generateCuid()
    const orderId = generateCuid()
    const driverId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.order.findFirst as any).mockResolvedValue({
      id: orderId,
      status: 'READY',
      vendorId,
    })
    ;(checkFeatureAccess as any).mockResolvedValue(true)
    ;(prisma.driverVendorConnection.findFirst as any).mockResolvedValue(null)

    const { PATCH } = await import('@/app/api/vendors/orders/route')
    const req = createMockRequest('http://localhost:3000/api/vendors/orders', {
      method: 'PATCH',
      body: { orderId, driverId },
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.success).toBe(false)
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  it('clears driver with driverId null without checking connection', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { checkFeatureAccess } = await import('@/lib/featureGate')
    const { emitOrderUpdated } = await import('@/lib/events')

    const vendorId = generateCuid()
    const orderId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: vendorId, role: 'VENDOR' },
    })
    ;(prisma.order.findFirst as any).mockResolvedValue({
      id: orderId,
      status: 'READY',
      vendorId,
    })
    ;(checkFeatureAccess as any).mockResolvedValue(true)

    const updated = {
      id: orderId,
      vendorId,
      driverId: null,
      status: 'READY',
      items: [],
      customer: { id: generateCuid(), name: 'C', phone: '1', email: 'e@e.com' },
      vendor: { id: vendorId, name: 'V' },
      driver: null,
      store: { id: generateCuid(), name: 'S', address: 'A' },
    }
    ;(prisma.order.update as any).mockResolvedValue(updated)

    const { PATCH } = await import('@/app/api/vendors/orders/route')
    const req = createMockRequest('http://localhost:3000/api/vendors/orders', {
      method: 'PATCH',
      body: { orderId, driverId: null },
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.driverVendorConnection.findFirst).not.toHaveBeenCalled()
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          driverId: null,
          assignedAt: null,
        }),
      }),
    )
    expect(emitOrderUpdated).toHaveBeenCalledWith(updated)
  })

  it('returns 400 when orderId is missing', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth as any).mockResolvedValue({
      user: { id: generateCuid(), role: 'VENDOR' },
    })

    const { PATCH } = await import('@/app/api/vendors/orders/route')
    const req = createMockRequest('http://localhost:3000/api/vendors/orders', {
      method: 'PATCH',
      body: { driverId: generateCuid() },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})
