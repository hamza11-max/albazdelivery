import { NextRequest } from 'next/server'
import { successResponse, errorResponse, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { isFullAdmin } from '@/root/lib/admin-roles'

const integrationKeys = [
  { id: 'stripe', label: 'Stripe (paiements)', envVar: 'STRIPE_SECRET_KEY' },
  { id: 'nextauth', label: 'NextAuth', envVar: 'NEXTAUTH_SECRET' },
  { id: 'database', label: 'Base PostgreSQL', envVar: 'DATABASE_URL' },
  { id: 'redis', label: 'Redis / Upstash', envVar: 'UPSTASH_REDIS_REST_URL' },
  { id: 'resend', label: 'Email (Resend)', envVar: 'RESEND_API_KEY' },
] as const

/** Non-secret deployment flags for admin troubleshooting. */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || !isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins')
    }
    return successResponse({
      config: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
        vercel: Boolean(process.env.VERCEL),
        vercelEnv: process.env.VERCEL_ENV ?? null,
        guestOrdersOnVercel: process.env.GUEST_ORDERS_ALLOW_ON_VERCEL === '1',
        starterPlanWithoutStripe: process.env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE === 'true',
        integrationKeys: integrationKeys.map((k) => ({
          ...k,
          configured: Boolean(process.env[k.envVar]),
        })),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
