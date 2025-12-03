import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// GET /api/debug/env - Diagnostic endpoint for runtime environment checks.
// Returns booleans for the presence of critical env vars and a lightweight
// Prisma connectivity check. DOES NOT return secret values.
// Only accessible to admins in production.
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Restrict to development or admin users in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment) {
      const session = await auth()
      if (!session?.user) {
        throw new UnauthorizedError()
      }
      if (session.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only admins can access debug endpoints in production')
      }
    }

    const env = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL_INTERNAL: !!process.env.NEXTAUTH_URL_INTERNAL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NODE_ENV: process.env.NODE_ENV ?? 'unknown',
      // Add URL validation check (without exposing actual URL)
      NEXTAUTH_URL_VALID: process.env.NEXTAUTH_URL?.startsWith('https://'),
      // Check for common issues
      DATABASE_URL_HAS_SSL: process.env.DATABASE_URL?.includes('sslmode='),
      DEPLOYMENT_URL: process.env.DEPLOY_URL || process.env.URL || 'not-set',
      REDIS_URL: !!process.env.REDIS_URL,
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    }

    let prismaReachable: boolean | 'skipped' = 'skipped'
    let prismaError: string | null = null

    if (process.env.DATABASE_URL) {
      try {
        // Attempt a super-lightweight DB call with timeout to verify connectivity.
        // We purposely avoid returning any DB data.
        const ping = prisma.$queryRaw`SELECT 1` as Promise<unknown>

        const res = await Promise.race([
          ping,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ])

        prismaReachable = res !== null
      } catch (e: any) {
        prismaReachable = false
        prismaError = e?.message || 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      env,
      prisma: {
        reachable: prismaReachable,
        error: prismaError,
      },
      note: 'This endpoint only reports boolean presence of env vars and a lightweight DB ping. It will NOT expose secret values.',
      environment: isDevelopment ? 'development' : 'production',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}
