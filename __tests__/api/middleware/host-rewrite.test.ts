import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

/**
 * Storefront host-rewrite tests for the root `middleware.ts`.
 *
 * The middleware must transparently rewrite vendor subdomain and custom-domain
 * hosts into `/s/{vendorSlug}/...` so the App Router storefront tree can handle
 * them, while leaving reserved hosts (base domain, `admin.`, `api.`, internal
 * Next.js paths, etc.) untouched.
 */

jest.mock('@/root/lib/security/csrf', () => ({
  csrfProtection: jest.fn(() => null),
  setCsrfTokenCookie: jest.fn(),
  generateCsrfToken: jest.fn(() => 'test-csrf-token'),
}))

jest.mock('@/root/lib/security/headers', () => {
  const { NextResponse } = jest.requireActual<{ NextResponse: unknown }>(
    'next/server'
  )
  return {
    applySecurityHeaders: jest.fn((r: any) => r),
    securityHeadersMiddleware: jest.fn((_req: any, r: any) => r),
    handleCorsPreflight: jest.fn(() => null),
    getSecurityHeaders: jest.fn(() => ({})),
    getCorsHeaders: jest.fn(() => ({})),
    // Not used but NextResponse is returned from other branches
    _noop: NextResponse,
  }
})

jest.mock('@/root/lib/security/audit-client-info', () => ({
  auditSecurityEventConsole: jest.fn(),
  getClientInfo: jest.fn(() => ({})),
}))

function buildRequest(host: string, pathname = '/', method = 'GET'): NextRequest {
  const url = new URL(pathname, `http://${host}`)
  return new NextRequest(url, {
    method,
    headers: { host },
  })
}

function getRewriteTarget(response: Response): string | null {
  return response.headers.get('x-middleware-rewrite')
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}

describe('middleware storefront host rewrite', () => {
  const originalEnv = process.env.BASE_DOMAIN
  const originalNextAuthUrl = process.env.NEXTAUTH_URL
  const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL
  const originalVercelUrl = process.env.VERCEL_URL
  const originalVercelProjectProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  const originalPlatformHosts = process.env.ALBAZ_PLATFORM_HOSTS
  const originalNodeEnv = process.env.NODE_ENV
  const originalVendorDomainsDevUnlock = process.env.VENDOR_DOMAINS_DEV_UNLOCK

  beforeEach(() => {
    process.env.BASE_DOMAIN = 'albazdelivery.com'
    delete process.env.NEXTAUTH_URL
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXT_PUBLIC_API_URL
    delete process.env.VERCEL_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.ALBAZ_PLATFORM_HOSTS
    delete process.env.VENDOR_DOMAINS_DEV_UNLOCK
    jest.clearAllMocks()
  })

  afterEach(() => {
    restoreEnv('BASE_DOMAIN', originalEnv)
    restoreEnv('NEXTAUTH_URL', originalNextAuthUrl)
    restoreEnv('NEXT_PUBLIC_APP_URL', originalNextPublicAppUrl)
    restoreEnv('NEXT_PUBLIC_API_URL', originalNextPublicApiUrl)
    restoreEnv('VERCEL_URL', originalVercelUrl)
    restoreEnv(
      'VERCEL_PROJECT_PRODUCTION_URL',
      originalVercelProjectProductionUrl
    )
    restoreEnv('ALBAZ_PLATFORM_HOSTS', originalPlatformHosts)
  })

  it('rewrites vendor subdomain host to /s/{slug}{path}', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.albazdelivery.com', '/products/abc')
    const response = await middleware(request)

    const rewrite = getRewriteTarget(response)
    expect(rewrite).not.toBeNull()
    expect(new URL(rewrite!).pathname).toBe('/s/demo/products/abc')
  })

  it('rewrites root path of a vendor subdomain to /s/{slug}', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.albazdelivery.com', '/')
    const response = await middleware(request)

    const rewrite = getRewriteTarget(response)
    expect(rewrite).not.toBeNull()
    expect(new URL(rewrite!).pathname).toBe('/s/demo')
  })

  it('rewrites {slug}.localhost to /s/{slug} when NODE_ENV is development', async () => {
    process.env.NODE_ENV = 'development'

    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.localhost:3000', '/menu')
    const response = await middleware(request)

    const rewrite = getRewriteTarget(response)
    expect(rewrite).not.toBeNull()
    expect(new URL(rewrite!).pathname).toBe('/s/demo/menu')
  })

  it('rewrites {slug}.localhost when VENDOR_DOMAINS_DEV_UNLOCK=1 (e.g. next start local)', async () => {
    process.env.VENDOR_DOMAINS_DEV_UNLOCK = '1'

    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.localhost:3000', '/')
    const response = await middleware(request)

    const rewrite = getRewriteTarget(response)
    expect(rewrite).not.toBeNull()
    expect(new URL(rewrite!).pathname).toBe('/s/demo')
  })

  it('rewrites custom-domain host via /s/__host__ sentinel', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('shop.myvendor.com', '/cart')
    const response = await middleware(request)

    const rewrite = getRewriteTarget(response)
    expect(rewrite).not.toBeNull()
    expect(new URL(rewrite!).pathname).toBe('/s/__host__/cart')
  })

  it('does not rewrite the configured production app host login page', async () => {
    process.env.NEXTAUTH_URL = 'https://al-baz.app'

    const middleware = (await import('@/middleware')).default
    const request = buildRequest('al-baz.app', '/login')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite platform host aliases from ALBAZ_PLATFORM_HOSTS', async () => {
    process.env.ALBAZ_PLATFORM_HOSTS = 'al-baz.app,www.al-baz.app'

    const middleware = (await import('@/middleware')).default
    const request = buildRequest('www.al-baz.app', '/login')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite the base domain host', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('albazdelivery.com', '/about')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite www base domain host', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('www.albazdelivery.com', '/about')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite reserved subdomains like admin.', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('admin.albazdelivery.com', '/')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite /api/ paths', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.albazdelivery.com', '/api/public/storefront/demo/profile')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite Next.js internal /_next/ paths', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.albazdelivery.com', '/_next/static/chunks/main.js')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite requests that are already under /s/', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('demo.albazdelivery.com', '/s/demo/products/abc')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite for localhost dev host without BASE_DOMAIN match', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('localhost:3000', '/')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })

  it('does not rewrite for an IP literal host', async () => {
    const middleware = (await import('@/middleware')).default
    const request = buildRequest('127.0.0.1:3000', '/')
    const response = await middleware(request)

    expect(getRewriteTarget(response)).toBeNull()
  })
})
