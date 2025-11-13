/**
 * API Route Tests: ERP Inventory
 * Tests for /api/erp/inventory endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryProduct: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    supplier: {
      findFirst: jest.fn(),
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

describe('POST /api/erp/inventory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create inventory product with valid data', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const vendorId = generateCuid()
    const productId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Mock supplier check (no supplier)
    ;(prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null)

    // Mock SKU check (unique)
    ;(prisma.inventoryProduct.findFirst as jest.Mock).mockResolvedValue(null)

    // Mock product creation
    const mockProduct = {
      id: productId,
      vendorId: vendorId,
      sku: 'SKU001',
      name: 'Test Product',
      category: 'Food',
      costPrice: 100,
      sellingPrice: 150,
      stock: 50,
      lowStockThreshold: 10,
      supplier: null,
    }
    ;(prisma.inventoryProduct.create as jest.Mock).mockResolvedValue(mockProduct)

    // Import route handler
    const { POST } = await import('@/app/api/erp/inventory/route')

    // Create request using helper
    const request = createMockRequest('http://localhost:3000/api/erp/inventory', {
      method: 'POST',
      body: {
        sku: 'SKU001',
        name: 'Test Product',
        category: 'Food',
        costPrice: 100,
        sellingPrice: 150,
        stock: 50,
        lowStockThreshold: 10,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.product).toMatchObject({
      sku: 'SKU001',
      name: 'Test Product',
    })
  })

  it('should reject duplicate SKU', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const vendorId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Mock duplicate SKU
    ;(prisma.inventoryProduct.findFirst as jest.Mock).mockResolvedValue({
      id: generateCuid(),
      sku: 'SKU001',
    })

    // Import route handler
    const { POST } = await import('@/app/api/erp/inventory/route')

    // Create request using helper
    const request = createMockRequest('http://localhost:3000/api/erp/inventory', {
      method: 'POST',
      body: {
        sku: 'SKU001',
        name: 'Test Product',
        category: 'Food',
        costPrice: 100,
        sellingPrice: 150,
        stock: 50,
        lowStockThreshold: 10,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toMatchObject(
      expect.objectContaining({
        message: expect.stringContaining('SKU already exists'),
      })
    )
  })

  it('should reject invalid data', async () => {
    const { auth } = await import('@/lib/auth')

    const vendorId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Import route handler
    const { POST } = await import('@/app/api/erp/inventory/route')

    // Create request with invalid data (missing required fields)
    const request = createMockRequest('http://localhost:3000/api/erp/inventory', {
      method: 'POST',
      body: {
        sku: 'SKU001',
        // Missing name, category, etc.
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should require vendor role', async () => {
    const { auth } = await import('@/lib/auth')

    // Mock unauthenticated user
    ;(auth as jest.Mock).mockResolvedValue(null)

    // Import route handler
    const { POST } = await import('@/app/api/erp/inventory/route')

    const request = createMockRequest('http://localhost:3000/api/erp/inventory', {
      method: 'POST',
      body: {
        sku: 'SKU001',
        name: 'Test Product',
        category: 'Food',
        costPrice: 100,
        sellingPrice: 150,
        stock: 50,
        lowStockThreshold: 10,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

describe('GET /api/erp/inventory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return inventory products for vendor', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const vendorId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Mock products
    const mockProducts = [
      {
        id: generateCuid(),
        vendorId: vendorId,
        sku: 'SKU001',
        name: 'Product 1',
        stock: 50,
        supplier: null,
      },
      {
        id: generateCuid(),
        vendorId: vendorId,
        sku: 'SKU002',
        name: 'Product 2',
        stock: 30,
        supplier: null,
      },
    ]
    ;(prisma.inventoryProduct.findMany as jest.Mock).mockResolvedValue(mockProducts)

    // Import route handler
    const { GET } = await import('@/app/api/erp/inventory/route')

    // Create request using helper
    const request = createMockRequest('http://localhost:3000/api/erp/inventory', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.products).toHaveLength(2)
    expect(prisma.inventoryProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          vendorId: vendorId,
        },
      })
    )
  })
})

describe('DELETE /api/erp/inventory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete product owned by vendor', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const vendorId = generateCuid()
    const productId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Mock existing product
    ;(prisma.inventoryProduct.findUnique as jest.Mock).mockResolvedValue({
      id: productId,
      vendorId: vendorId,
    })

    // Mock deletion
    ;(prisma.inventoryProduct.delete as jest.Mock).mockResolvedValue({})

    // Import route handler
    const { DELETE } = await import('@/app/api/erp/inventory/route')

    // Create request with query parameter using helper
    const request = createMockRequest(`http://localhost:3000/api/erp/inventory?id=${productId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.message).toContain('deleted')
  })

  it('should reject deletion of product not owned by vendor', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')

    const vendorId = generateCuid()
    const otherProductId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Mock product not found (not owned by vendor)
    ;(prisma.inventoryProduct.findUnique as jest.Mock).mockResolvedValue(null)

    // Import route handler
    const { DELETE } = await import('@/app/api/erp/inventory/route')

    // Create request with query parameter using helper
    const request = createMockRequest(`http://localhost:3000/api/erp/inventory?id=${otherProductId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toMatchObject(
      expect.objectContaining({
        message: expect.stringContaining('not found'),
      })
    )
  })

  it('should reject invalid product ID format', async () => {
    const { auth } = await import('@/lib/auth')

    const vendorId = generateCuid()

    // Mock authenticated vendor
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: vendorId,
        role: 'VENDOR',
      },
    })

    // Import route handler
    const { DELETE } = await import('@/app/api/erp/inventory/route')

    // Create request with invalid ID using helper
    const request = createMockRequest('http://localhost:3000/api/erp/inventory?id=invalid-id', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toMatchObject(
      expect.objectContaining({
        message: expect.stringContaining('Invalid product ID format'),
      })
    )
  })
})

