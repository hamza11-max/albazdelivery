#!/usr/bin/env node
/**
 * Validates required env vars for production deployments.
 * Runs when REQUIRE_DEPLOY_SECRETS=1 or VERCEL_ENV=production.
 */
const requireSecrets =
  process.env.REQUIRE_DEPLOY_SECRETS === '1' || process.env.VERCEL_ENV === 'production'

if (!requireSecrets) {
  console.log(
    '[verify-deploy-env] Skip (set REQUIRE_DEPLOY_SECRETS=1 on CI, or run on Vercel production)'
  )
  process.exit(0)
}

const required = ['DATABASE_URL', 'NEXTAUTH_SECRET']
const stripeOn =
  process.env.STRIPE_BILLING_ENABLED === '1' ||
  Boolean(
    process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
if (stripeOn) {
  required.push('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET')
}

const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '')

if (missing.length) {
  console.error('[verify-deploy-env] Missing required environment variables:', missing.join(', '))
  process.exit(1)
}

const upstashOk = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    String(process.env.UPSTASH_REDIS_REST_URL).trim() &&
    String(process.env.UPSTASH_REDIS_REST_TOKEN).trim() &&
    !String(process.env.UPSTASH_REDIS_REST_URL).includes('your-upstash') &&
    !String(process.env.UPSTASH_REDIS_REST_TOKEN).includes('your-upstash')
)

if (requireSecrets && !upstashOk) {
  const msg =
    '[verify-deploy-env] Rate limiting: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — production will fall back to in-memory limits (not suitable for multi-instance).'
  if (process.env.STRICT_PRODUCTION_RATE_LIMIT === '1') {
    console.error(msg, 'Fail (STRICT_PRODUCTION_RATE_LIMIT=1).')
    process.exit(1)
  }
  console.warn(msg)
}

if (
  process.env.STRIPE_WEBHOOK_USE_QUEUE === '1' &&
  (!process.env.REDIS_HOST || !String(process.env.REDIS_HOST).trim())
) {
  console.warn(
    '[verify-deploy-env] STRIPE_WEBHOOK_USE_QUEUE=1 but REDIS_HOST is missing — webhooks will fall back to inline processing; deploy a worker when REDIS_HOST is set.'
  )
}

if (
  process.env.NODE_ENV === 'production' &&
  String(process.env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE || '').trim() === '1'
) {
  console.warn(
    '[verify-deploy-env] WARNING: ALLOW_STARTER_PLAN_WITHOUT_STRIPE=1 — confirm this is intentional for this environment.'
  )
}

console.log('[verify-deploy-env] OK')
