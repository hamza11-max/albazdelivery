# Background jobs, BullMQ, and Redis

The root app may use **BullMQ** queues when traditional Redis is available — see `lib/cache.ts`. Queue names include **`orders`**, **`notifications`**, **`analytics`**, and **`stripe-webhooks`**.

## When queues are active

- **`REDIS_HOST`** (and optional **`REDIS_PORT`**, default `6379`) must be set so `createQueuesProxy()` materializes real `Queue` instances.
- **`REDIS_URL`** + **`REDIS_TOKEN`** in the same file relate to **Upstash Redis** (HTTP) for a different code path — rate limiting often uses **`UPSTASH_REDIS_REST_URL`** / **`UPSTASH_REDIS_REST_TOKEN`** from `lib/rate-limit.ts` instead.

## Stripe webhooks: inline vs queued

- **Default:** HTTP handler at `app/api/webhooks/stripe/route.ts` verifies the signature, records **`ProcessedStripeWebhookEvent`**, then runs **`dispatchStripeWebhookEvent`** in the same process.
- **Queued:** Set **`STRIPE_WEBHOOK_USE_QUEUE=1`** with **`REDIS_HOST`** set. The route enqueues a BullMQ job on **`stripe-webhooks`** (job id = Stripe event id) and returns **`{ received: true, queued: true }`**. If enqueue fails, it **falls back** to synchronous dispatch.
- **Worker:** Run `npm run worker:stripe-webhook` on a long-lived Node process that can reach Redis and Postgres. Without a worker, queued events will **stall** in Redis.

## Operational DLQ

Failed jobs use **`removeOnFail: false`** for the Stripe queue so attempts exhausted remain inspectable in Redis (BullMQ failed set). Replay via BullMQ tooling or Stripe dashboard event replay + idempotency (`ProcessedStripeWebhookEvent`).

## Production expectations

- Without **`REDIS_HOST`**, queue `add` calls are **proxied no-ops** in some code paths — do not enable **`STRIPE_WEBHOOK_USE_QUEUE`** unless workers and Redis are real.
- **Stripe webhook** processing is **not** “always sync” when queue mode is on; operations must monitor **worker health** and **failed job depth** in addition to HTTP 5xx.

## Operations checklist

1. Set **`REDIS_HOST`** (and auth if your provider requires a password in the connection — align with your infra).
2. If using queued webhooks: set **`STRIPE_WEBHOOK_USE_QUEUE=1`**, deploy **`worker:stripe-webhook`**, and alert on failed-job growth.
3. Deploy **workers** for other queues or remove code paths that enqueue work if unused.
4. Monitor queue depth, worker restarts, and webhook 5xx separately.
