import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/root/lib/prisma'
import { headers } from 'next/headers'
import { queues } from '@/lib/cache'
import {
  logMoneyPathEvent,
  captureMoneyPathException,
} from '@/lib/observability/money-path-log'
import { dispatchStripeWebhookEvent } from '@/lib/stripe-webhook-dispatch'

function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  )
}

function shouldEnqueueStripeWebhook(): boolean {
  return (
    process.env.STRIPE_WEBHOOK_USE_QUEUE === '1' &&
    Boolean(process.env.REDIS_HOST && String(process.env.REDIS_HOST).trim())
  )
}

export async function POST(request: NextRequest) {
  const t0 = Date.now()
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    logMoneyPathEvent({
      component: 'stripe_webhook',
      action: 'reject_missing_signature',
      severity: 'warn',
    })
    return new Response('No signature', { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logMoneyPathEvent({
      component: 'stripe_webhook',
      action: 'reject_missing_secret',
      severity: 'error',
    })
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event: import('stripe').Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logMoneyPathEvent({
      component: 'stripe_webhook',
      action: 'signature_verify_failed',
      severity: 'warn',
      detail: { message: msg },
    })
    console.error('[Webhook] Signature verification failed:', msg)
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  logMoneyPathEvent({
    component: 'stripe_webhook',
    action: 'event_received',
    stripeEventId: event.id,
    eventType: event.type,
    durationMs: Date.now() - t0,
  })

  try {
    await prisma.processedStripeWebhookEvent.create({
      data: { id: event.id, type: event.type },
    })
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      logMoneyPathEvent({
        component: 'stripe_webhook',
        action: 'duplicate_event',
        stripeEventId: event.id,
        eventType: event.type,
        severity: 'info',
      })
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw e
  }

  const useQueue = shouldEnqueueStripeWebhook()

  if (useQueue) {
    try {
      const q = queues.stripeWebhooks as { add?: (name: string, data: object, opts?: object) => Promise<unknown> }
      if (q && typeof q.add === 'function') {
        await q.add(
          'dispatch',
          { eventJson: JSON.stringify(event) },
          { jobId: event.id }
        )
        logMoneyPathEvent({
          component: 'stripe_webhook',
          action: 'enqueued',
          stripeEventId: event.id,
          eventType: event.type,
          durationMs: Date.now() - t0,
        })
        return new Response(JSON.stringify({ received: true, queued: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (enqueueErr) {
      logMoneyPathEvent({
        component: 'stripe_webhook',
        action: 'enqueue_failed_fallback_sync',
        severity: 'warn',
        stripeEventId: event.id,
        eventType: event.type,
        detail: {
          message: enqueueErr instanceof Error ? enqueueErr.message : String(enqueueErr),
        },
      })
      console.warn('[Webhook] Queue enqueue failed, processing synchronously:', enqueueErr)
    }
  }

  try {
    await dispatchStripeWebhookEvent(event)

    logMoneyPathEvent({
      component: 'stripe_webhook',
      action: 'handler_ok',
      stripeEventId: event.id,
      eventType: event.type,
      durationMs: Date.now() - t0,
    })

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    await prisma.processedStripeWebhookEvent.delete({ where: { id: event.id } }).catch(() => {})
    await captureMoneyPathException(error, {
      stripeEventId: event.id,
      eventType: event.type,
    })
    logMoneyPathEvent({
      component: 'stripe_webhook',
      action: 'handler_error',
      severity: 'error',
      stripeEventId: event.id,
      eventType: event.type,
      detail: { message: error instanceof Error ? error.message : String(error) },
    })
    console.error('[Webhook] Error processing event:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
}
