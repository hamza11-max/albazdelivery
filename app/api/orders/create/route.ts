import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { createOrderSchema } from '@/root/lib/validations/order'
import { OrderStatus } from '@/lib/constants'
import { createOrderInternal } from '@/root/lib/orders/create-order-internal'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()

    const isDev = process.env.NODE_ENV === 'development'
    let validatedData: any
    try {
      validatedData = createOrderSchema.parse(body)
    } catch (error) {
      if (isDev) {
        // Fallback for mock/demo data in dev: coerce minimal fields
        const items = Array.isArray(body?.items) ? body.items : []
        const subtotal = typeof body?.subtotal === 'number' ? body.subtotal : 0
        const deliveryFee = typeof body?.deliveryFee === 'number' ? body.deliveryFee : 0
        const total = typeof body?.total === 'number' ? body.total : subtotal + deliveryFee
        validatedData = {
          storeId: String(body?.storeId || 'demo-store'),
          items,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: String(body?.paymentMethod || 'CASH').toUpperCase(),
          deliveryAddress: body?.deliveryAddress || 'Demo address, Alger',
          city: body?.city || 'Alger',
          customerPhone: body?.customerPhone || '0555000000',
        }
      } else {
        throw error
      }
    }

    const {
      storeId,
      items,
      deliveryFee,
      paymentMethod,
      deliveryAddress,
      city,
      customerPhone,
    } = validatedData

    // Normalize payment method once, using the validated value.
    const normalizedPaymentMethod = (paymentMethod?.toUpperCase() || 'CASH') as import('@/generated/prisma/client').PaymentMethod

    // Get store and vendor info (or fallback in dev)
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, vendorId: true, isActive: true },
    }).catch(() => null)

    if (!store || !store.isActive) {
      if (!isDev) {
        return errorResponse(new Error('Store not found or inactive'), 404)
      }
      // Dev fallback: return mock order without hitting DB
      const mockOrder = {
        id: `demo-order-${Date.now()}`,
        storeId,
        vendorId: store?.vendorId ?? null,
        customerId: session.user.id,
        items,
        subtotal,
        deliveryFee,
        total,
        status: OrderStatus.PENDING,
        paymentMethod: normalizedPaymentMethod,
        deliveryAddress,
        city,
        customerPhone,
        createdAt: new Date().toISOString(),
      }
      return successResponse({ order: mockOrder }, 201)
    }

    const order = await createOrderInternal({
      customerId: session.user.id,
      storeId,
      items: items.map((item: { productId: string; quantity: number; price: number }) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      deliveryFee,
      paymentMethod: normalizedPaymentMethod,
      deliveryAddress,
      city,
      customerPhone,
      orderSource: 'APP',
      recomputePricing: false,
    })

    return successResponse({ order }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
