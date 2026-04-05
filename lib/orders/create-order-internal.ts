import { prisma } from '@/root/lib/prisma'
import { emitOrderCreated, emitNotificationSent } from '@/root/lib/events'
import { OrderStatus } from '@/lib/constants'
import type { OrderSource, PaymentMethod } from '@/generated/prisma/client'

export type InternalOrderLineInput = {
  productId: string
  quantity: number
  /** Ignored when recomputePricing is true */
  price?: number
}

export type CreateOrderInternalInput = {
  customerId: string
  storeId: string
  items: InternalOrderLineInput[]
  deliveryFee: number
  paymentMethod: PaymentMethod
  deliveryAddress: string
  city: string
  customerPhone: string
  orderSource?: OrderSource
  /** When true, loads unit prices from DB and rejects unknown/unavailable products */
  recomputePricing: boolean
}

export async function createOrderInternal(params: CreateOrderInternalInput) {
  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
    select: { id: true, vendorId: true, isActive: true },
  })

  if (!store?.vendorId || !store.isActive) {
    throw new Error('Store not found or inactive')
  }

  let lines: { productId: string; quantity: number; price: number }[]

  if (params.recomputePricing) {
    const ids = [...new Set(params.items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { storeId: params.storeId, id: { in: ids } },
      select: { id: true, price: true, available: true },
    })
    const byId = new Map(products.map((p) => [p.id, p]))
    lines = params.items.map((item) => {
      const p = byId.get(item.productId)
      if (!p?.available) {
        throw new Error(`Product unavailable or not in store: ${item.productId}`)
      }
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: p.price,
      }
    })
  } else {
    lines = params.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price ?? 0,
    }))
  }

  const subtotal = lines.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = subtotal + params.deliveryFee

  const order = await prisma.order.create({
    data: {
      customerId: params.customerId,
      vendorId: store.vendorId,
      storeId: store.id,
      subtotal,
      deliveryFee: params.deliveryFee,
      total,
      status: OrderStatus.PENDING,
      paymentMethod: params.paymentMethod,
      deliveryAddress: params.deliveryAddress,
      city: params.city,
      customerPhone: params.customerPhone,
      orderSource: params.orderSource ?? 'APP',
      items: {
        create: lines.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
      customer: { select: { id: true, name: true, phone: true } },
      store: { select: { id: true, name: true, address: true } },
    },
  })

  emitOrderCreated(order)

  const vendorNotification = await prisma.notification.create({
    data: {
      recipientId: store.vendorId,
      recipientRole: 'VENDOR',
      type: 'ORDER_STATUS',
      title: 'New Order Received',
      message: `New order #${order.id} from customer`,
      relatedOrderId: order.id,
      actionUrl: `/vendor?orderId=${order.id}`,
    },
  })
  emitNotificationSent(vendorNotification)

  if (params.paymentMethod !== 'CASH') {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: params.customerId,
        amount: total,
        method: params.paymentMethod,
        status: 'PENDING',
      },
    })
  }

  const pointsToAward = Math.floor(total * 0.05)
  if (pointsToAward > 0) {
    const loyaltyAccount = await prisma.loyaltyAccount.upsert({
      where: { customerId: params.customerId },
      create: { customerId: params.customerId },
      update: {},
    })
    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: {
        points: { increment: pointsToAward },
        totalPointsEarned: { increment: pointsToAward },
      },
    })
    await prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        type: 'EARN',
        points: pointsToAward,
        description: `Points earned from order ${order.id}`,
        relatedOrderId: order.id,
      },
    })
  }

  return order
}
