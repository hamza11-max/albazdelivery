import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/debug/session - Debug endpoint for session information
// Only accessible in development or to admins in production
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

    const session = await auth()
    
    // Sanitize sensitive data
    const sanitizedCookies = request.cookies.getAll().map((c: any) => ({
      name: c.name,
      value: c.value ? c.value.slice(0, 10) + '...' : '',
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
    }))

    const headers = {
      host: request.headers.get('host') || '',
      origin: request.headers.get('origin') || '',
      referer: request.headers.get('referer') || '',
      userAgent: request.headers.get('user-agent') || '',
    }

    const env = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
      NODE_ENV: process.env.NODE_ENV || '',
    }

    // Sanitize session data - don't expose sensitive information
    const sanitizedSession = session ? {
      user: session.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email ? session.user.email.slice(0, 3) + '***' : null,
        role: session.user.role,
        image: session.user.image ? '***' : null,
      } : null,
      expires: session.expires,
    } : null

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      url: request.url,
      headers,
      cookies: sanitizedCookies,
      env,
      session: sanitizedSession,
      environment: isDevelopment ? 'development' : 'production',
      note: 'Session data is sanitized. Sensitive information is not exposed.',
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
