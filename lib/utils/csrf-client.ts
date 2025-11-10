/**
 * Client-side CSRF token utilities
 * Helps fetch and include CSRF tokens in API requests
 */

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === '__Host-csrf-token') {
      return decodeURIComponent(value)
    }
  }

  return null
}

/**
 * Get CSRF token from server
 * Fetches token from API endpoint
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
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
 */
export async function addCsrfTokenToHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit> {
  const token = await getCsrfToken()
  
  const headersObj = headers instanceof Headers ? headers : new Headers(headers)
  
  if (token) {
    headersObj.set('X-CSRF-Token', token)
  }

  return headersObj
}

/**
 * Fetch with CSRF token automatically included
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await addCsrfTokenToHeaders(options.headers)
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  })
}

