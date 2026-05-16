import 'server-only'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { createOrderInternal } from '@/lib/orders/create-order-internal'
import { ensureGuestCustomerByPhone } from '@/lib/storefront/ensure-guest-customer'
import { signOrderToken } from '@/lib/storefront/orders'
import { resolveVendorBySlugOrHost } from '@/lib/storefront/resolve-vendor-slug'

const nestedCustomerSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(6),
  address: z.string().max(500).optional(),
  city: z.string().min(1).max(120).optional(),
  notes: z.string().max(1000).optional(),
})

export const storefrontOrderBodySchema = z
  .object({
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
    customer: nestedCustomerSchema.optional(),
    clientName: z.string().min(1).max(120).optional(),
    clientPhone: z.string().min(6).optional(),
    clientAddress: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']).default('CASH'),
  })
  .transform((body) => ({
    vendorSlug: body.vendorSlug,
    storeId: body.storeId,
    items: body.items,
    customer: {
      name: body.customer?.name ?? body.clientName ?? '',
      phone: body.customer?.phone ?? body.clientPhone ?? '',
      address: body.customer?.address ?? body.clientAddress ?? '',
      city: body.customer?.city,
      notes: body.customer?.notes ?? body.notes,
    },
    paymentMethod: body.paymentMethod,
  }))

export async function createStorefrontOrder({
  rawBody,
  tenantHost,
}: {
  rawBody: unknown
  tenantHost?: string | null
}) {
  const parsed = storefrontOrderBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map((issue) => issue.message).join('; ') ||
        'Invalid order payload'
    )
  }

  const body = parsed.data
  if (!body.customer.name.trim() || !body.customer.phone.trim()) {
    throw new ValidationError('clientName and clientPhone are required')
  }

  const vendor = await resolveVendorBySlugOrHost({
    slug: body.vendorSlug,
    tenantHost,
  })
  if (!vendor) throw new NotFoundError('Vendor storefront')

  const resolvedItems = await resolveItemsToStores({
    vendorId: vendor.id,
    items: body.items,
    hintStoreId: body.storeId,
  })

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

  const clientAddress = body.customer.address?.trim() || ''
  const notes = body.customer.notes?.trim() || null
  const city = body.customer.city || vendor.city || ''

  const order = await createOrderInternal({
    customerId: customer.id,
    storeId,
    items: resolvedItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })),
    deliveryFee: 0,
    paymentMethod: body.paymentMethod,
    deliveryAddress: clientAddress,
    city,
    customerPhone: customer.phone,
    clientName: body.customer.name.trim(),
    clientPhone: customer.phone,
    clientAddress: clientAddress || null,
    notes,
    orderSource: 'APP',
    recomputePricing: true,
  })

  return {
    orderId: order.id,
    estimatedTime: order.store?.deliveryTime || null,
    vendorWhatsApp: vendor.storefrontWhatsappPhone || vendor.phone || null,
    token: signOrderToken(order.id),
    status: order.status,
    total: order.total,
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
    const product = byId.get(item.productId)
    if (!product) {
      throw new ValidationError(
        `Product not found or unavailable: ${item.productId}`
      )
    }
    const storeId = item.storeId || hintStoreId || product.storeId
    if (storeId !== product.storeId) {
      throw new ValidationError(
        `Item ${item.productId} does not belong to store ${storeId}`
      )
    }
    return { productId: item.productId, storeId, quantity: item.quantity }
  })
}
