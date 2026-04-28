import { NextRequest } from 'next/server'
import { successResponse, errorResponse, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

/** Non-secret deployment flags for admin troubleshooting. */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
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
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
