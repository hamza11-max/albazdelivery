import 'server-only'
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'

/**
 * Opaque order-confirmation tokens.
 *
 * We derive an HMAC of the order id using the app's AUTH_SECRET (same secret
 * NextAuth uses) so that we don't need a separate DB column. A guest who
 * completed checkout gets back `{ orderId, token }` and can access their
 * confirmation page at `/orders/:id?t=:token` without authenticating.
 */
function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    'storefront-dev-secret'
  )
}

export function signOrderToken(orderId: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`storefront-order:${orderId}`)
    .digest('hex')
    .slice(0, 32)
}

export function verifyOrderToken(orderId: string, token: string): boolean {
  const expected = signOrderToken(orderId)
  if (expected.length !== token.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(token, 'utf8')
    )
  } catch {
    return false
  }
}

export interface StorefrontOrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string; image: string | null } | null
}

export interface StorefrontOrderView {
  id: string
  status: string
  paymentMethod: string
  subtotal: number
  deliveryFee: number
  total: number
  deliveryAddress: string
  city: string
  customerPhone: string
  createdAt: Date
  items: StorefrontOrderItem[]
}

/**
 * Fetch an order for the storefront confirmation page. Returns null if the
 * order doesn't exist, belongs to a different vendor, or the token is invalid.
 */
export async function fetchStorefrontOrder({
  vendorId,
  orderId,
  token,
}: {
  vendorId: string
  orderId: string
  token: string
}): Promise<StorefrontOrderView | null> {
  if (!verifyOrderToken(orderId, token)) return null

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      vendorId: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      deliveryAddress: true,
      city: true,
      customerPhone: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: { select: { name: true, image: true } },
        },
      },
    },
  })

  if (!order || order.vendorId !== vendorId) return null

  return {
    id: order.id,
    status: String(order.status),
    paymentMethod: String(order.paymentMethod),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    deliveryAddress: order.deliveryAddress,
    city: order.city,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      price: i.price,
      product: i.product
        ? { name: i.product.name, image: i.product.image }
        : null,
    })),
  }
}
