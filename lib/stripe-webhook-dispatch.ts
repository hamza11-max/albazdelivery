import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { logMoneyPathEvent } from '@/lib/observability/money-path-log'
import {
  applyPaymentIntentSucceeded,
  applyPaymentIntentFailed,
} from '@/lib/stripe-webhook-order-payments'

/**
 * Core Stripe webhook side effects (subscriptions, marketplace payments).
 * Used synchronously from the HTTP route and asynchronously from the BullMQ worker when enabled.
 */
export async function dispatchStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status:
            subscription.status === 'active'
              ? 'ACTIVE'
              : subscription.status === 'canceled'
                ? 'CANCELLED'
                : subscription.status === 'past_due'
                  ? 'PAST_DUE'
                  : 'EXPIRED',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        },
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription && 'id' in invoice.subscription
            ? (invoice.subscription as Stripe.Subscription).id
            : null
      if (!subId) break

      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subId },
      })

      if (subscription) {
        const pi =
          typeof invoice.payment_intent === 'string'
            ? invoice.payment_intent
            : invoice.payment_intent && 'id' in (invoice.payment_intent as object)
              ? (invoice.payment_intent as Stripe.PaymentIntent).id
              : null

        if (pi) {
          const existing = await prisma.subscriptionPayment.findUnique({
            where: { stripePaymentId: pi },
          })
          if (!existing) {
            await prisma.subscriptionPayment.create({
              data: {
                subscriptionId: subscription.id,
                amount: (invoice.amount_paid ?? 0) / 100,
                currency: invoice.currency ?? 'usd',
                status: 'COMPLETED',
                stripePaymentId: pi,
                invoiceUrl: invoice.hosted_invoice_url ?? null,
                paidAt: new Date(),
              },
            })
          }
        } else {
          await prisma.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              amount: (invoice.amount_paid ?? 0) / 100,
              currency: invoice.currency ?? 'usd',
              status: 'COMPLETED',
              stripePaymentId: null,
              invoiceUrl: invoice.hosted_invoice_url ?? null,
              paidAt: new Date(),
            },
          })
        }

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription && 'id' in invoice.subscription
            ? (invoice.subscription as Stripe.Subscription).id
            : null
      if (!subId) break

      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subId },
      })

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAST_DUE' },
        })
      }
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const oid = pi.metadata?.orderId
      logMoneyPathEvent({
        component: 'stripe_webhook_dispatch',
        action: 'payment_intent_succeeded_apply',
        stripeEventId: event.id,
        eventType: event.type,
        orderId: typeof oid === 'string' ? oid : undefined,
        paymentIntentId: pi.id,
      })
      await applyPaymentIntentSucceeded(pi)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const oid = pi.metadata?.orderId
      logMoneyPathEvent({
        component: 'stripe_webhook_dispatch',
        action: 'payment_intent_failed_apply',
        stripeEventId: event.id,
        eventType: event.type,
        orderId: typeof oid === 'string' ? oid : undefined,
        paymentIntentId: pi.id,
      })
      await applyPaymentIntentFailed(pi)
      break
    }

    default:
      logMoneyPathEvent({
        component: 'stripe_webhook_dispatch',
        action: 'unhandled_event_type',
        severity: 'info',
        stripeEventId: event.id,
        eventType: event.type,
      })
  }
}
