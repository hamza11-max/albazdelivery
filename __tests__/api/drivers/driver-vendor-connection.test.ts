/**
 * POST /api/drivers/vendor-connection — accept / reject vendor invitations
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    driverVendorConnection: {
      findUnique: jest.fn(),
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

jest.mock('@/lib/events', () => ({
  emitNotificationSent: jest.fn(),
}))

describe('POST /api/drivers/vendor-connection', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('accepts a VENDOR_INVITED pending connection', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { emitNotificationSent } = await import('@/lib/events')

    const driverId = generateCuid()
    const vendorId = generateCuid()
    const connectionId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'Ali' },
    })

    ;(prisma.driverVendorConnection.findUnique as any).mockResolvedValue({
      id: connectionId,
      driverId,
      vendorId,
      status: 'PENDING',
      connectionSource: 'VENDOR_INVITED',
      vendor: { id: vendorId, name: 'Shop' },
    })

    const updated = {
      id: connectionId,
      driverId,
      vendorId,
      status: 'ACCEPTED',
      connectionSource: 'VENDOR_INVITED',
    }
    ;(prisma.driverVendorConnection.update as any).mockResolvedValue(updated)

    const notif = { id: generateCuid() }
    ;(prisma.notification.create as any).mockResolvedValue(notif)

    const { POST } = await import('@/app/api/drivers/vendor-connection/route')
    const res = await POST(
      createMockRequest('http://localhost:3000/api/drivers/vendor-connection', {
        method: 'POST',
        body: { connectionId, action: 'accept' },
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.connection.status).toBe('ACCEPTED')
    expect(prisma.driverVendorConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: connectionId },
        data: expect.objectContaining({ status: 'ACCEPTED', respondedAt: expect.any(Date) }),
      }),
    )
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: vendorId,
          recipientRole: 'VENDOR',
        }),
      }),
    )
    expect(emitNotificationSent).toHaveBeenCalledWith(notif)
  })

  it('rejects a VENDOR_INVITED pending connection', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const driverId = generateCuid()
    const vendorId = generateCuid()
    const connectionId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'Ali' },
    })
    ;(prisma.driverVendorConnection.findUnique as any).mockResolvedValue({
      id: connectionId,
      driverId,
      vendorId,
      status: 'PENDING',
      connectionSource: 'VENDOR_INVITED',
      vendor: { id: vendorId, name: 'Shop' },
    })
    ;(prisma.driverVendorConnection.update as any).mockResolvedValue({
      id: connectionId,
      status: 'REJECTED',
    })
    ;(prisma.notification.create as any).mockResolvedValue({ id: generateCuid() })

    const { POST } = await import('@/app/api/drivers/vendor-connection/route')
    const res = await POST(
      createMockRequest('http://localhost:3000/api/drivers/vendor-connection', {
        method: 'POST',
        body: { connectionId, action: 'reject' },
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.driverVendorConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED' }),
      }),
    )
  })

  it('returns 403 when connection belongs to another driver', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const driverId = generateCuid()
    const otherDriver = generateCuid()
    const connectionId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'Ali' },
    })
    ;(prisma.driverVendorConnection.findUnique as any).mockResolvedValue({
      id: connectionId,
      driverId: otherDriver,
      vendorId: generateCuid(),
      status: 'PENDING',
      connectionSource: 'VENDOR_INVITED',
      vendor: { id: generateCuid(), name: 'Shop' },
    })

    const { POST } = await import('@/app/api/drivers/vendor-connection/route')
    const res = await POST(
      createMockRequest('http://localhost:3000/api/drivers/vendor-connection', {
        method: 'POST',
        body: { connectionId, action: 'accept' },
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.success).toBe(false)
    expect(prisma.driverVendorConnection.update).not.toHaveBeenCalled()
  })

  it('returns validation error when connection is not vendor-invited', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const driverId = generateCuid()
    const connectionId = generateCuid()

    ;(auth as any).mockResolvedValue({
      user: { id: driverId, role: 'DRIVER', name: 'Ali' },
    })
    ;(prisma.driverVendorConnection.findUnique as any).mockResolvedValue({
      id: connectionId,
      driverId,
      vendorId: generateCuid(),
      status: 'PENDING',
      connectionSource: 'DRIVER_REQUESTED',
      vendor: { id: generateCuid(), name: 'Shop' },
    })

    const { POST } = await import('@/app/api/drivers/vendor-connection/route')
    const res = await POST(
      createMockRequest('http://localhost:3000/api/drivers/vendor-connection', {
        method: 'POST',
        body: { connectionId, action: 'accept' },
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('vendor dashboard')
    expect(prisma.driverVendorConnection.update).not.toHaveBeenCalled()
  })
})
