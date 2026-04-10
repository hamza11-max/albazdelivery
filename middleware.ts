import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  csrfProtection,
  setCsrfTokenCookie,
  generateCsrfToken,
} from '@/lib/security/csrf'
import {
  securityHeadersMiddleware,
  handleCorsPreflight,
  applySecurityHeaders,
} from '@/lib/security/headers'
import {
  auditSecurityEventConsole,
  getClientInfo,
} from '@/lib/security/audit-client-info'
import { extractSubdomain, normalizeHost } from '@/lib/domains/utils'

/**
 * Global middleware with:
 * - Conditional CSRF protection
 * - Security headers
 * - CORS handling
 * - Audit logging
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  const normalizedHost = normalizeHost(request.headers.get('host'))
  const baseDomain = normalizeHost(process.env.BASE_DOMAIN || '') || 'albazdelivery.com'

  if (normalizedHost) {
    requestHeaders.set('x-tenant-host', normalizedHost)

    const tenantSubdomain = extractSubdomain(normalizedHost, baseDomain)
    if (tenantSubdomain) {
      requestHeaders.set('x-tenant-subdomain', tenantSubdomain)
    }
  }

  // ---------------------------------------------------------
  // 0. Handle CORS preflight
  // ---------------------------------------------------------
  const corsPreflight = handleCorsPreflight(request)
  if (corsPreflight) return applySecurityHeaders(corsPreflight)

  // ---------------------------------------------------------
  // 1. Skip middleware entirely for static files, Next internals, images, auth
  // ---------------------------------------------------------
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') || // NextAuth handles its own CSRF
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js)$/)
  ) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return applySecurityHeaders(response)
  }

  // ---------------------------------------------------------
  // 2. CONDITIONAL CSRF
  //
  // Only enable CSRF for:
  // - Public API endpoints
  // - Mutation requests (POST, PATCH, PUT, DELETE)
  //
  // Disable CSRF for:
  // - ERP routes (/api/erp/*)
  // - GET requests (idempotent)
  // ---------------------------------------------------------

  const isPublicApi = pathname.startsWith('/api/public/')
  const isMutation =
    request.method === 'POST' ||
    request.method === 'PUT' ||
    request.method === 'PATCH' ||
    request.method === 'DELETE'

  if (pathname.startsWith('/api/') && isPublicApi && isMutation) {
    const csrfResponse = csrfProtection(request)
    if (csrfResponse) {
      // Log CSRF violation
      const clientInfo = getClientInfo(request)
      auditSecurityEventConsole(
        'CSRF_TOKEN_INVALID',
        undefined,
        undefined,
        request,
        {
          path: pathname,
          method: request.method,
          ...clientInfo,
        }
      )
      return applySecurityHeaders(csrfResponse)
    }
  }

  // ---------------------------------------------------------
  // 3. Create main response
  // ---------------------------------------------------------
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // ---------------------------------------------------------
  // 4. Set CSRF token if absent (for frontend to use)
  // ---------------------------------------------------------
  const existingToken = request.cookies.get('__Host-csrf-token')?.value
  if (!existingToken) {
    const token = generateCsrfToken()
    setCsrfTokenCookie(response, token)
  }

  // ---------------------------------------------------------
  // 5. Apply security headers to all valid responses
  // ---------------------------------------------------------
  return securityHeadersMiddleware(request, response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
