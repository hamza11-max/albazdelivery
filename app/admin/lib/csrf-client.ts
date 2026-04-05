/**
 * Client-side CSRF token utilities for Admin App
 * Fetches CSRF token and includes it in request headers
 *
 * Tokens are NOT cached: the value must match the httpOnly cookie on each
 * mutation. A singleton cache caused 403 (CSRF_TOKEN_INVALID) after the cookie
 * was rotated or the first fetch failed.
 */

const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
const CSRF_TOKEN_ENDPOINT = '/api/csrf-token'

/**
 * Fetch a fresh CSRF token from the server (always aligned with the cookie).
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(CSRF_TOKEN_ENDPOINT, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.warn('[CSRF] Failed to fetch token:', response.status)
      return null
    }

    const data = await response.json()
    if (data.success && data.data?.token) {
      return data.data.token as string
    }

    return null
  } catch (error) {
    console.error('[CSRF] Error fetching token:', error)
    return null
  }
}

/** @deprecated No-op; cache was removed. Kept for call sites that clear on error. */
export function clearCsrfTokenCache(): void {}

export async function addCsrfTokenToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await fetchCsrfToken()
  const headersObj = new Headers(headers)

  if (token) {
    headersObj.set(CSRF_TOKEN_HEADER, token)
  }

  return headersObj
}

export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  let headers = options.headers

  if (isMutation) {
    headers = await addCsrfTokenToHeaders(options.headers)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!isMutation || response.status !== 403) {
    return response
  }

  let payload: { error?: { code?: string }; success?: boolean } = {}
  try {
    payload = await response.clone().json()
  } catch {
    return response
  }

  if (payload?.error?.code !== 'CSRF_TOKEN_INVALID') {
    return response
  }

  const headers2 = await addCsrfTokenToHeaders(options.headers as HeadersInit)
  return fetch(url, {
    ...options,
    headers: headers2,
    credentials: 'include',
  })
}
