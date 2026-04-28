/**
 * BullMQ consumer for Stripe webhook side effects.
 *
 * Prerequisites: `REDIS_HOST`, `DATABASE_URL`, Prisma migrate applied.
 * Enable enqueue from HTTP: `STRIPE_WEBHOOK_USE_QUEUE=1`.
 *
 * Run: `npm run worker:stripe-webhook`
 */
import { Worker } from 'bullmq'
import type Stripe from 'stripe'

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}

async function main() {
  if (!process.env.REDIS_HOST) {
    console.error('[stripe-webhook-worker] REDIS_HOST is required')
    process.exit(1)
  }

  const { dispatchStripeWebhookEvent } = await import('../lib/stripe-webhook-dispatch')

  const worker = new Worker(
    'stripe-webhooks',
    async (job) => {
      const event = JSON.parse(job.data.eventJson as string) as Stripe.Event
      await dispatchStripeWebhookEvent(event)
    },
    { connection, concurrency: 2 }
  )

  worker.on('failed', (job, err) => {
    const max = job?.opts.attempts ?? 8
    if (job && job.attemptsMade >= max) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          observability: 'money_path_v1',
          component: 'stripe_webhook_worker',
          action: 'job_failed_exhausted',
          severity: 'error',
          stripeEventId:
            (() => {
              try {
                const ev = JSON.parse(job.data.eventJson as string) as Stripe.Event
                return ev.id
              } catch {
                return undefined
              }
            })(),
          detail: {
            jobId: job.id,
            message: err instanceof Error ? err.message : String(err),
            attemptsMade: job.attemptsMade,
          },
        })
      )
    }
  })

  console.info('[stripe-webhook-worker] listening queue=stripe-webhooks redis=%s:%s', connection.host, connection.port)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
