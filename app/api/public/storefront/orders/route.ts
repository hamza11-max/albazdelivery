import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  errorResponse,
  NotFoundError,
  successResponse,
  ValidationError,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { resolveVendorBySlugOrHost } from '@/lib/storefront/resolve-vendor-slug'
import { ensureGuestCustomerByPhone } from '@/lib/storefront/ensure-guest-customer'
import { signOrderToken } from '@/lib/storefront/orders'
import { createOrderInternal } from '@/lib/orders/create-order-internal'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const orderBodySchema = z.object({
  vendorSlug: z.string().min(1).optional(),
  storeId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        storeId: z.string().min(1).optional(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1, 'At least one item is required'),
  customer: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().min(6),
    address: z.string().min(4).max(500),
    city: z.string().min(1).max(120).optional(),
    notes: z.string().max(1000).optional(),
  }),
  paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']).default('CASH'),
})

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const raw = await request.json().catch(() => null)
    const parsed = orderBodySchema.safeParse(raw)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join('; ') ||
          'Invalid order payload'
      )
    }
    const body = parsed.data

    const tenantHost = request.headers.get('x-tenant-host')
    const vendor = await resolveVendorBySlugOrHost({
      slug: body.vendorSlug,
      tenantHost,
    })
    if (!vendor) throw new NotFoundError('Vendor storefront')

    // Group items by store to figure out which Store each line belongs to.
    // If the client passed storeId per item we trust it; otherwise we resolve
    // from the product's storeId.
    const resolvedItems = await resolveItemsToStores({
      vendorId: vendor.id,
      items: body.items,
      hintStoreId: body.storeId,
    })

    // Validate that ALL products belong to ONE store (v1 constraint — same as
    // the existing `createOrderInternal` which takes a single storeId).
    const uniqueStoreIds = Array.from(new Set(resolvedItems.map((i) => i.storeId)))
    if (uniqueStoreIds.length !== 1) {
      throw new ValidationError(
        'All cart items must belong to the same store for this checkout.'
      )
    }

    const storeId = uniqueStoreIds[0]
    const customer = await ensureGuestCustomerByPhone({
      phone: body.customer.phone,
      name: body.customer.name,
    })

    const deliveryAddress = body.customer.notes
      ? `${body.customer.address} (Notes: ${body.customer.notes})`
      : body.customer.address
    const city = body.customer.city || vendor.city || ''

    const order = await createOrderInternal({
      customerId: customer.id,
      storeId,
      items: resolvedItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      deliveryFee: 0, // v1: no variable fee on the storefront — vendor can override
      paymentMethod: body.paymentMethod,
      deliveryAddress,
      city,
      customerPhone: customer.phone,
      orderSource: 'APP',
      recomputePricing: true,
    })

    const token = signOrderToken(order.id)

    return successResponse(
      {
        orderId: order.id,
        token,
        status: order.status,
        total: order.total,
      },
      201
    )
  } catch (error) {
    return errorResponse(error)
  }
}

async function resolveItemsToStores({
  vendorId,
  items,
  hintStoreId,
}: {
  vendorId: string
  items: { productId: string; storeId?: string; quantity: number }[]
  hintStoreId?: string
}): Promise<{ productId: string; storeId: string; quantity: number }[]> {
  const productIds = Array.from(new Set(items.map((i) => i.productId)))

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      store: { vendorId, isActive: true },
      available: true,
    },
    select: { id: true, storeId: true },
  })

  const byId = new Map(products.map((p) => [p.id, p]))

  return items.map((item) => {
    const p = byId.get(item.productId)
    if (!p) {
      throw new ValidationError(
        `Product not found or unavailable: ${item.productId}`
      )
    }
    const storeId = item.storeId || hintStoreId || p.storeId
    if (storeId !== p.storeId) {
      throw new ValidationError(
        `Item ${item.productId} does not belong to store ${storeId}`
      )
    }
    return { productId: item.productId, storeId, quantity: item.quantity }
  })
}
