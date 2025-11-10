import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { csrfProtection, setCsrfTokenCookie, generateCsrfToken } from '@/lib/security/csrf'
import { securityHeadersMiddleware, handleCorsPreflight, applySecurityHeaders } from '@/lib/security/headers'
import { auditSecurityEvent, getClientInfo } from '@/lib/security/audit-log'

/**
 * Middleware with security features:
 * - CSRF protection
 * - Security headers
 * - CORS handling
 * - Audit logging
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) {
    return applySecurityHeaders(corsResponse)
  }

  // Skip security for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') || // NextAuth handles its own security
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js)$/)
  ) {
    const response = NextResponse.next()
    return applySecurityHeaders(response)
  }

  // CSRF protection for API routes (except auth routes)
  if (pathname.startsWith('/api/')) {
    const csrfResponse = csrfProtection(request)
    if (csrfResponse) {
      // Log CSRF violation
      const clientInfo = getClientInfo(request)
      await auditSecurityEvent('CSRF_TOKEN_INVALID', undefined, undefined, request, {
        path: pathname,
        method: request.method,
        ...clientInfo,
      })
      return applySecurityHeaders(csrfResponse)
    }
  }

  // Create response
  const response = NextResponse.next()

  // Set CSRF token cookie if not present
  const existingToken = request.cookies.get('__Host-csrf-token')?.value
  if (!existingToken) {
    const token = generateCsrfToken()
    setCsrfTokenCookie(response, token)
  }

  // Apply security headers
  return securityHeadersMiddleware(request, response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
