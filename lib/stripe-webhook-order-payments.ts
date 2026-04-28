import type { Stripe } from 'stripe'
import { prisma } from '@/lib/prisma'

/**
 * Apply `payment_intent.succeeded` to the marketplace Payment row (order metadata on the PI).
 * Idempotent at the Payment row level (safe if Stripe redelivers after our row exists).
 */
export async function applyPaymentIntentSucceeded(
  pi: Stripe.PaymentIntent
): Promise<void> {
  const orderId = pi.metadata?.orderId
  if (!orderId || typeof orderId !== 'string') {
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, total: true, payment: { select: { id: true, status: true } } },
  })

  if (!order) {
    return
  }

  const amountMajor = pi.amount_received / 100

  if (order.payment) {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: 'COMPLETED',
        transactionId: pi.id,
        completedAt: new Date(),
        amount: amountMajor,
      },
    })
    return
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      customerId: order.customerId,
      amount: amountMajor,
      method: 'CARD',
      status: 'COMPLETED',
      transactionId: pi.id,
      completedAt: new Date(),
    },
  })
}

/** Mark payment FAILED when Stripe reports intent failure (does not delete the row). */
export async function applyPaymentIntentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const orderId = pi.metadata?.orderId
  if (!orderId || typeof orderId !== 'string') {
    return
  }

  const existing = await prisma.payment.findUnique({
    where: { orderId },
  })

  if (!existing) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    })
    if (!order) return
    await prisma.payment.create({
      data: {
        orderId,
        customerId: order.customerId,
        amount: pi.amount ? pi.amount / 100 : 0,
        method: 'CARD',
        status: 'FAILED',
        transactionId: pi.id,
      },
    })
    return
  }

  await prisma.payment.update({
    where: { orderId },
    data: {
      status: 'FAILED',
      transactionId: pi.id,
    },
  })
}
