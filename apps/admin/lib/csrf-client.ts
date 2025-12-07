/**
 * Client-side CSRF token utilities for Admin App
 * Fetches CSRF token and includes it in request headers
 */

const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
const CSRF_TOKEN_ENDPOINT = '/api/csrf-token'

let csrfTokenCache: string | null = null

/**
 * Fetch CSRF token from server
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    // Use cached token if available
    if (csrfTokenCache) {
      return csrfTokenCache
    }

    const response = await fetch(CSRF_TOKEN_ENDPOINT, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
    })

    if (!response.ok) {
      console.warn('[CSRF] Failed to fetch token:', response.status)
      return null
    }

    const data = await response.json()
    if (data.success && data.data?.token) {
      csrfTokenCache = data.data.token
      return csrfTokenCache
    }

    return null
  } catch (error) {
    console.error('[CSRF] Error fetching token:', error)
    return null
  }
}

/**
 * Clear CSRF token cache (useful after errors)
 */
export function clearCsrfTokenCache(): void {
  csrfTokenCache = null
}

/**
 * Add CSRF token to request headers
 */
export async function addCsrfTokenToHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit> {
  const token = await fetchCsrfToken()
  const headersObj = new Headers(headers)

  if (token) {
    headersObj.set(CSRF_TOKEN_HEADER, token)
  }

  return headersObj
}

/**
 * Fetch with CSRF token automatically included
 * Only adds CSRF token for mutation requests (POST, PUT, PATCH, DELETE)
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'
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

