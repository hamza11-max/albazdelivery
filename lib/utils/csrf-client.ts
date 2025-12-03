/**
 * Client-side CSRF token utilities
 * Consistent with middleware.ts CSRF implementation
 * 
 * Cookie: __Host-csrf-token (httpOnly, so not directly accessible)
 * Header: X-CSRF-Token
 * 
 * Since the cookie is httpOnly, we need to fetch it from the server
 */

import { CSRF_COOKIE_NAME, CSRF_TOKEN_HEADER } from '@/root/lib/security/csrf'

/**
 * Get CSRF token from cookie (if accessible)
 * Note: __Host-csrf-token is httpOnly, so this will typically return null
 * Use fetchCsrfToken() or the useCsrf() hook instead
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  // httpOnly cookies cannot be accessed via document.cookie
  // This function is kept for compatibility but will typically return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }

  return null
}

/**
 * Get CSRF token from server
 * The cookie is httpOnly, so we need to fetch it via an API endpoint
 * 
 * The middleware sets the cookie automatically, but we need to read it
 * from the server side. This function calls an API endpoint that
 * returns the token from the cookie.
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('[CSRF] Failed to fetch token:', response.status)
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.error('[CSRF] Error fetching token:', error)
    return null
  }
}

/**
 * Get CSRF token (from cookie or fetch from server)
 */
export async function getCsrfToken(): Promise<string | null> {
  // Try to get from cookie first
  const cookieToken = getCsrfTokenFromCookie()
  if (cookieToken) {
    return cookieToken
  }

  // If not in cookie, fetch from server
  return await fetchCsrfToken()
}

/**
 * Add CSRF token to fetch request headers
 * Uses CSRF_TOKEN_HEADER constant from security/csrf
 */
export async function addCsrfTokenToHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit> {
  const token = await getCsrfToken()
  
  const headersObj = headers instanceof Headers ? headers : new Headers(headers)
  
  if (token) {
    headersObj.set(CSRF_TOKEN_HEADER, token)
  }

  return headersObj
}

/**
 * Fetch with CSRF token automatically included
 * 
 * Only adds CSRF token for mutation requests (POST, PUT, PATCH, DELETE)
 * Matches middleware.ts behavior
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  
  let headers = options.headers
  if (isMutation) {
    headers = await addCsrfTokenToHeaders(options.headers)
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important: include cookies for CSRF
  })
}

