/**
 * API Route Tests: Batch Route Optimization
 * Tests for /api/delivery/batch-optimize endpoint
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
    },
    driver: {
      findMany: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock rate limit
jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: {
    api: {},
  },
}))

// Mock events
jest.mock('@/lib/events', () => ({
  emitOrderAssigned: jest.fn(),
}))

describe('POST /api/delivery/batch-optimize', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should optimize routes for multiple orders', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const adminId = generateCuid()
    const orderId1 = generateCuid()
    const orderId2 = generateCuid()
    const driverId1 = generateCuid()
    const driverId2 = generateCuid()

    // Mock authenticated admin
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: adminId,
        role: 'ADMIN',
      },
    })

    // Mock orders
    const mockOrders = [
      {
        id: orderId1,
        status: 'READY',
        createdAt: new Date('2024-01-01'),
        deliveryAddress: {},
        store: { id: generateCuid(), address: 'Store 1', city: 'Algiers' },
      },
      {
        id: orderId2,
        status: 'READY',
        createdAt: new Date('2024-01-02'),
        deliveryAddress: {},
        store: { id: generateCuid(), address: 'Store 2', city: 'Algiers' },
      },
    ]
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)

    // Mock drivers
    const mockDrivers = [
      {
        userId: driverId1,
        name: 'Driver 1',
        location: { isActive: true },
        _count: { orders: 0 },
      },
      {
        userId: driverId2,
        name: 'Driver 2',
        location: { isActive: true },
        _count: { orders: 1 },
      },
    ]
    ;(prisma.driver.findMany as jest.Mock).mockResolvedValue(mockDrivers)

    // Import route handler
    const { POST } = await import('@/app/api/delivery/batch-optimize/route')

    // Create request using helper
    const request = createMockRequest('http://localhost:3000/api/delivery/batch-optimize', {
      method: 'POST',
      body: {
        orders: [
          { orderId: orderId1 },
          { orderId: orderId2 },
        ],
        optimizationStrategy: 'BALANCED',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.routes).toBeDefined()
    expect(data.data.totalOrders).toBe(2)
  })

  it('should reject invalid order IDs', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const adminId = generateCuid()

    // Mock authenticated admin
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: adminId,
        role: 'ADMIN',
      },
    })

    // Mock orders not found (invalid IDs won't pass validation, but if they do, return empty)
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])

    // Import route handler
    const { POST } = await import('@/app/api/delivery/batch-optimize/route')

    // Use invalid CUID format - should fail validation
    const request = createMockRequest('http://localhost:3000/api/delivery/batch-optimize', {
      method: 'POST',
      body: {
        orders: [
          { orderId: 'invalid-order-id' }, // Invalid CUID format
        ],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should require admin or driver role', async () => {
    const { auth } = await import('@/lib/auth')

    const customerId = generateCuid()
    const orderId = generateCuid()

    // Mock customer role (not allowed)
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: customerId,
        role: 'CUSTOMER',
      },
    })

    // Import route handler
    const { POST } = await import('@/app/api/delivery/batch-optimize/route')

    const request = createMockRequest('http://localhost:3000/api/delivery/batch-optimize', {
      method: 'POST',
      body: {
        orders: [
          { orderId: orderId },
        ],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toMatchObject(
      expect.objectContaining({
        message: expect.stringContaining('Only admins and drivers'),
      })
    )
  })

  it('should handle no available drivers', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const adminId = generateCuid()
    const orderId = generateCuid()

    // Mock authenticated admin
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: adminId,
        role: 'ADMIN',
      },
    })

    // Mock orders
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: orderId,
        status: 'READY',
        createdAt: new Date(),
        deliveryAddress: {},
        store: { id: generateCuid(), address: 'Store 1', city: 'Algiers' },
      },
    ])

    // Mock no drivers available
    ;(prisma.driver.findMany as jest.Mock).mockResolvedValue([])

    // Import route handler
    const { POST } = await import('@/app/api/delivery/batch-optimize/route')

    const request = createMockRequest('http://localhost:3000/api/delivery/batch-optimize', {
      method: 'POST',
      body: {
        orders: [
          { orderId: orderId },
        ],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toMatchObject(
      expect.objectContaining({
        message: expect.stringContaining('No active drivers'),
      })
    )
  })
})

