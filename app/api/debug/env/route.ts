import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

// GET /api/debug/env - Diagnostic endpoint for runtime environment checks.
// Returns booleans for the presence of critical env vars and a lightweight
// Prisma connectivity check. DOES NOT return secret values.
export async function GET() {
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
    DEPLOYMENT_URL: process.env.DEPLOY_URL || process.env.URL || 'not-set'
  }

  let prismaReachable: boolean | 'skipped' = 'skipped'

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
    } catch (e) {
      prismaReachable = false
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    env,
    prisma: prismaReachable,
    note: 'This endpoint only reports boolean presence of env vars and a lightweight DB ping. It will NOT expose secret values.',
  })
}
