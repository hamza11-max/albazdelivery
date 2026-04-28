import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function upstashConfigured(): boolean {
  const u = process.env.UPSTASH_REDIS_REST_URL
  const t = process.env.UPSTASH_REDIS_REST_TOKEN
  return Boolean(
    u &&
      t &&
      String(u).trim() &&
      String(t).trim() &&
      !String(u).includes('your-upstash') &&
      !String(t).includes('your-upstash')
  )
}

// GET /api/health - Liveness + dependency signal (no auth)
export async function GET() {
  let database: 'not_configured' | 'reachable' | 'unreachable' = process.env.DATABASE_URL
    ? 'reachable'
    : 'not_configured'

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`
      database = 'reachable'
    } catch (error) {
      database = 'unreachable'
      console.error('[Health] Database ping failed:', error)
    }
  }

  const bullMqHost = Boolean(process.env.REDIS_HOST && String(process.env.REDIS_HOST).trim())
  const stripeWebhookQueued =
    process.env.STRIPE_WEBHOOK_USE_QUEUE === '1' && bullMqHost

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    database,
    dependencies: {
      /** Upstash REST — shared rate limit backend when configured (see lib/rate-limit.ts). */
      rateLimitRedis: upstashConfigured() ? 'upstash' : 'not_configured',
      /** BullMQ TCP — queue names materialize only when REDIS_HOST is set (lib/cache.ts). */
      bullMqRedis: bullMqHost ? 'configured' : 'not_configured',
      stripeWebhookDelivery: stripeWebhookQueued ? 'queued' : 'inline',
    },
  })
}
