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
import {
  extractSubdomain,
  isReservedSubdomain,
  normalizeHost,
} from '@/lib/domains/utils'

/**
 * Pathnames that must NEVER be rewritten to the storefront, even when the
 * request arrives on a vendor subdomain or custom domain.
 */
const STOREFRONT_BYPASS_PREFIXES = [
  '/_next/',
  '/api/',
  '/s/',
  '/__nextjs_', // Next.js internal endpoints
]

const STOREFRONT_BYPASS_EXACT = new Set([
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
])

function shouldBypassStorefrontRewrite(pathname: string): boolean {
  if (STOREFRONT_BYPASS_EXACT.has(pathname)) return true
  if (/\.[a-z0-9]+$/i.test(pathname)) return true // static asset (png, css, js...)
  return STOREFRONT_BYPASS_PREFIXES.some((p) => pathname === p.slice(0, -1) || pathname.startsWith(p))
}

function collectPlatformHosts(baseDomain: string): Set<string> {
  const rawHosts = [
    baseDomain,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.ALBAZ_PLATFORM_HOSTS,
  ]

  const hosts = new Set<string>()
  for (const raw of rawHosts) {
    if (!raw) continue
    for (const part of raw.split(',')) {
      const host = normalizeHost(part)
      if (host) hosts.add(host)
    }
  }

  return hosts
}

/**
 * Global middleware with:
 * - Tenant host + subdomain detection (take.app-style storefront rewriting)
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
  const platformHosts = collectPlatformHosts(baseDomain)

  // Detect tenant host + (optional) subdomain
  let tenantSubdomain: string | null = null
  let isCustomDomainHost = false

  if (normalizedHost) {
    requestHeaders.set('x-tenant-host', normalizedHost)

    tenantSubdomain = extractSubdomain(normalizedHost, baseDomain)
    if (tenantSubdomain && !isReservedSubdomain(tenantSubdomain)) {
      requestHeaders.set('x-tenant-subdomain', tenantSubdomain)
    } else if (
      normalizedHost !== baseDomain &&
      !platformHosts.has(normalizedHost) &&
      !normalizedHost.endsWith(`.${baseDomain}`) &&
      !normalizedHost.startsWith('localhost') &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(normalizedHost)
    ) {
      // Host is neither the base domain, a base-domain subdomain, localhost,
      // nor an IP literal → treat as a custom-domain storefront host.
      isCustomDomainHost = true
    }
  }

  // -----------------------------------------------------------------
  // Storefront rewrite (take.app-style). Edge-safe: no DB access here.
  // Vendor resolution by host happens inside app/s/[vendorSlug]/layout.tsx.
  // -----------------------------------------------------------------
  if (!shouldBypassStorefrontRewrite(pathname)) {
    if (tenantSubdomain && !isReservedSubdomain(tenantSubdomain)) {
      const url = request.nextUrl.clone()
      url.pathname = `/s/${tenantSubdomain}${pathname === '/' ? '' : pathname}`
      return applySecurityHeaders(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      )
    }

    if (isCustomDomainHost) {
      const url = request.nextUrl.clone()
      url.pathname = `/s/__host__${pathname === '/' ? '' : pathname}`
      return applySecurityHeaders(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      )
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
