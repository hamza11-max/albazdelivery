import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockRequest, generateCuid } from '@/__tests__/helpers/test-utils'

/**
 * Public storefront API tests — vendor subdomains (e.g. demo.al-baz.app).
 *
 * Covers:
 *  - GET  /api/public/storefront/[vendorSlug]/profile
 *  - GET  /api/public/storefront/[vendorSlug]/catalog
 *  - POST /api/public/storefront/orders (guest checkout)
 *  - GET  /api/public/storefront/orders/[id]?token=... (confirmation)
 */

jest.mock('server-only', () => ({}))

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    store: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    loyaltyAccount: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/root/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {}, relaxed: {}, strict: {} },
}))

jest.mock('@/root/lib/storefront/ensure-guest-customer', () => ({
  ensureGuestCustomerByPhone: jest.fn(),
}))

jest.mock('@/root/lib/orders/create-order-internal', () => ({
  createOrderInternal: jest.fn(),
}))

jest.mock('@/root/lib/storefront/catalog', () => ({
  getVendorCatalog: jest.fn(),
}))

jest.mock('@/root/lib/storefront/orders', () => ({
  signOrderToken: jest.fn(() => 'signed-token'),
  verifyOrderToken: jest.fn(() => true),
  fetchStorefrontOrder: jest.fn(),
}))

async function readJson(response: Response): Promise<any> {
  return response.json()
}

describe('Public storefront API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.BASE_DOMAIN = 'albazdelivery.com'
  })

  describe('GET /api/public/storefront/[vendorSlug]/profile', () => {
    it('returns 404 when vendor subdomain is unknown', async () => {
      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue(null)

      const { GET } = await import(
        '@/app/api/public/storefront/[vendorSlug]/profile/route'
      )
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/doesnotexist/profile'
      )

      const response = await GET(request, {
        params: Promise.resolve({ vendorSlug: 'doesnotexist' }),
      } as any)

      expect(response.status).toBe(404)
    })

    it('returns vendor branding + stores for a verified subdomain', async () => {
      const vendorId = generateCuid()
      const storeId = generateCuid()

      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue({
        id: vendorId,
        name: 'Le Taj Mahal',
        phone: '0771234567',
        vendorSubdomain: 'demo',
        vendorCustomDomain: null,
        vendorDomainStatus: 'VERIFIED',
        storefrontLogoUrl: null,
        storefrontHeroUrl: null,
        storefrontTagline: 'Tasty food',
        storefrontAccentColor: '#ea580c',
        storefrontWhatsappPhone: '+213771234567',
        city: 'Algiers',
      })
      ;(prisma.store.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: storeId,
          name: 'Main Store',
          type: 'Restaurant',
          address: 'Algiers',
          city: 'Algiers',
          phone: '0771234567',
          rating: 4.8,
          deliveryTime: '30-45 min',
        },
      ])

      const { GET } = await import(
        '@/app/api/public/storefront/[vendorSlug]/profile/route'
      )
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/demo/profile'
      )

      const response = await GET(request, {
        params: Promise.resolve({ vendorSlug: 'demo' }),
      } as any)

      expect(response.status).toBe(200)
      const payload = await readJson(response)
      expect(payload.success).toBe(true)
      expect(payload.data.vendor.id).toBe(vendorId)
      expect(payload.data.vendor.subdomain).toBe('demo')
      expect(payload.data.vendor.branding.accentColor).toBe('#ea580c')
      expect(payload.data.stores).toHaveLength(1)
      expect(payload.data.stores[0].id).toBe(storeId)
    })

    it('does not leak unverified vendors', async () => {
      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockImplementation(
        async (args: any) => {
          // Should only match vendors with vendorDomainStatus: 'VERIFIED'.
          const wantsVerified =
            args?.where?.vendorDomainStatus === 'VERIFIED'
          return wantsVerified ? null : null
        }
      )

      const { GET } = await import(
        '@/app/api/public/storefront/[vendorSlug]/profile/route'
      )
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/pending/profile'
      )

      const response = await GET(request, {
        params: Promise.resolve({ vendorSlug: 'pending' }),
      } as any)

      expect(response.status).toBe(404)

      // And the query MUST constrain by VERIFIED status.
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorDomainStatus: 'VERIFIED',
          }),
        })
      )
    })
  })

  describe('GET /api/public/storefront/[vendorSlug]/catalog', () => {
    it('returns the vendor catalog grouped by store', async () => {
      const vendorId = generateCuid()

      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue({
        id: vendorId,
        name: 'Le Taj Mahal',
        phone: '0771234567',
        vendorSubdomain: 'demo',
        vendorCustomDomain: null,
        vendorDomainStatus: 'VERIFIED',
        storefrontLogoUrl: null,
        storefrontHeroUrl: null,
        storefrontTagline: null,
        storefrontAccentColor: null,
        storefrontWhatsappPhone: null,
        city: 'Algiers',
      })

      const { getVendorCatalog } = await import('@/root/lib/storefront/catalog')
      ;(getVendorCatalog as jest.Mock<any>).mockResolvedValue({
        stores: [
          {
            id: 'store-1',
            name: 'Main Store',
            products: [
              {
                id: 'prod-1',
                storeId: 'store-1',
                name: 'Chicken Biryani',
                description: 'Tasty',
                price: 1200,
                image: null,
                available: true,
                category: 'Main',
                rating: 4.8,
              },
            ],
          },
        ],
        totalProducts: 1,
      })

      const { GET } = await import(
        '@/app/api/public/storefront/[vendorSlug]/catalog/route'
      )
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/demo/catalog'
      )

      const response = await GET(request, {
        params: Promise.resolve({ vendorSlug: 'demo' }),
      } as any)

      expect(response.status).toBe(200)
      const payload = await readJson(response)
      expect(payload.success).toBe(true)
      expect(payload.data.totalProducts).toBe(1)
      expect(payload.data.stores).toHaveLength(1)
      expect(getVendorCatalog).toHaveBeenCalledWith(vendorId)
    })
  })

  describe('POST /api/public/storefront/orders', () => {
    it('returns 400 when the payload is invalid', async () => {
      const { POST } = await import('@/app/api/public/storefront/orders/route')
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/orders',
        {
          method: 'POST',
          body: { items: [] },
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 404 when the vendor slug cannot be resolved', async () => {
      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue(null)

      const { POST } = await import('@/app/api/public/storefront/orders/route')
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/orders',
        {
          method: 'POST',
          body: {
            vendorSlug: 'nope',
            items: [{ productId: 'prod-1', quantity: 1 }],
            customer: {
              name: 'Test',
              phone: '0661234567',
              address: '123 Street',
            },
          },
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(404)
    })

    it('creates a guest order and returns {orderId, token}', async () => {
      const vendorId = generateCuid()
      const customerId = generateCuid()
      const storeId = 'store-1'
      const productId = 'prod-1'
      const orderId = generateCuid()

      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue({
        id: vendorId,
        name: 'Le Taj Mahal',
        phone: '0771234567',
        vendorSubdomain: 'demo',
        vendorCustomDomain: null,
        vendorDomainStatus: 'VERIFIED',
        storefrontLogoUrl: null,
        storefrontHeroUrl: null,
        storefrontTagline: null,
        storefrontAccentColor: null,
        storefrontWhatsappPhone: null,
        city: 'Algiers',
      })
      ;(prisma.product.findMany as jest.Mock<any>).mockResolvedValue([
        { id: productId, storeId },
      ])

      const { ensureGuestCustomerByPhone } = await import(
        '@/root/lib/storefront/ensure-guest-customer'
      )
      ;(ensureGuestCustomerByPhone as jest.Mock<any>).mockResolvedValue({
        id: customerId,
        phone: '0661234567',
        name: 'Test Guest',
      })

      const { createOrderInternal } = await import(
        '@/root/lib/orders/create-order-internal'
      )
      ;(createOrderInternal as jest.Mock<any>).mockResolvedValue({
        id: orderId,
        status: 'PENDING',
        total: 1200,
      })

      const { POST } = await import('@/app/api/public/storefront/orders/route')
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/orders',
        {
          method: 'POST',
          body: {
            vendorSlug: 'demo',
            storeId,
            items: [{ productId, quantity: 1 }],
            customer: {
              name: 'Test Guest',
              phone: '0661234567',
              address: '123 Customer Avenue, Algiers',
            },
            paymentMethod: 'CASH',
          },
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(201)
      const payload = await readJson(response)
      expect(payload.success).toBe(true)
      expect(payload.data.orderId).toBe(orderId)
      expect(payload.data.token).toBe('signed-token')
      expect(ensureGuestCustomerByPhone).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '0661234567' })
      )
      expect(createOrderInternal).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId,
          storeId,
          items: [{ productId, quantity: 1 }],
          paymentMethod: 'CASH',
        })
      )
    })

    it('rejects mixed-store carts (v1 constraint)', async () => {
      const vendorId = generateCuid()

      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue({
        id: vendorId,
        name: 'V',
        phone: '0',
        vendorSubdomain: 'demo',
        vendorCustomDomain: null,
        vendorDomainStatus: 'VERIFIED',
        storefrontLogoUrl: null,
        storefrontHeroUrl: null,
        storefrontTagline: null,
        storefrontAccentColor: null,
        storefrontWhatsappPhone: null,
        city: 'Algiers',
      })
      ;(prisma.product.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'p1', storeId: 's1' },
        { id: 'p2', storeId: 's2' },
      ])

      const { POST } = await import('@/app/api/public/storefront/orders/route')
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/orders',
        {
          method: 'POST',
          body: {
            vendorSlug: 'demo',
            items: [
              { productId: 'p1', quantity: 1 },
              { productId: 'p2', quantity: 1 },
            ],
            customer: {
              name: 'T',
              phone: '0661234567',
              address: '123',
            },
          },
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/public/storefront/orders/[id]', () => {
    it('returns 400 when token is missing', async () => {
      const { GET } = await import(
        '@/app/api/public/storefront/orders/[id]/route'
      )
      const request = createMockRequest(
        'http://localhost:3000/api/public/storefront/orders/abc'
      )

      const response = await GET(request, {
        params: Promise.resolve({ id: 'abc' }),
      } as any)
      expect(response.status).toBe(400)
    })

    it('returns the order when token is valid', async () => {
      const vendorId = generateCuid()
      const orderId = generateCuid()

      const { prisma } = await import('@/root/lib/prisma')
      ;(prisma.user.findFirst as jest.Mock<any>).mockResolvedValue({
        id: vendorId,
        name: 'V',
        phone: '0',
        vendorSubdomain: 'demo',
        vendorCustomDomain: null,
        vendorDomainStatus: 'VERIFIED',
        storefrontLogoUrl: null,
        storefrontHeroUrl: null,
        storefrontTagline: null,
        storefrontAccentColor: null,
        storefrontWhatsappPhone: null,
        city: 'Algiers',
      })

      const { fetchStorefrontOrder } = await import('@/root/lib/storefront/orders')
      ;(fetchStorefrontOrder as jest.Mock<any>).mockResolvedValue({
        id: orderId,
        status: 'PENDING',
        total: 1200,
      })

      const { GET } = await import(
        '@/app/api/public/storefront/orders/[id]/route'
      )
      const request = createMockRequest(
        `http://localhost:3000/api/public/storefront/orders/${orderId}?token=signed-token&vendorSlug=demo`
      )

      const response = await GET(request, {
        params: Promise.resolve({ id: orderId }),
      } as any)

      expect(response.status).toBe(200)
      const payload = await readJson(response)
      expect(payload.success).toBe(true)
      expect(payload.data.id).toBe(orderId)
      expect(fetchStorefrontOrder).toHaveBeenCalledWith({
        vendorId,
        orderId,
        token: 'signed-token',
      })
    })
  })
})
