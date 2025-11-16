"use client"

import { useState, useEffect, useCallback } from 'react'
import { CSRF_TOKEN_HEADER } from '@/lib/security/csrf'
import { fetchCsrfToken } from '@/lib/utils/csrf-client'

/**
 * React hook for CSRF token management
 * 
 * Consistent with middleware.ts CSRF implementation:
 * - Automatically fetches token on mount
 * - Provides token for mutation requests
 * - Handles token refresh
 * 
 * @example
 * ```tsx
 * const { token, isLoading, addToHeaders, fetchWithCsrf } = useCsrf()
 * 
 * // Use in fetch
 * const response = await fetch('/api/public/data', {
 *   method: 'POST',
 *   headers: await addToHeaders({ 'Content-Type': 'application/json' }),
 *   body: JSON.stringify(data),
 * })
 * 
 * // Or use the helper
 * const response = await fetchWithCsrf('/api/public/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * })
 * ```
 */
export function useCsrf() {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch CSRF token from server
   */
  const refreshToken = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newToken = await fetchCsrfToken()
      setToken(newToken)
      return newToken
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch CSRF token')
      setError(error)
      console.error('[useCsrf] Error:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch token on mount
  useEffect(() => {
    refreshToken()
  }, [refreshToken])

  /**
   * Add CSRF token to headers
   * Only adds token for mutation requests
   */
  const addToHeaders = useCallback(
    async (headers: HeadersInit = {}, method: string = 'GET'): Promise<HeadersInit> => {
      const methodUpper = method.toUpperCase()
      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)
      
      if (!isMutation) {
        return headers
      }

      // Ensure we have a token
      let csrfToken = token
      if (!csrfToken) {
        csrfToken = await refreshToken()
      }

      const headersObj = headers instanceof Headers ? headers : new Headers(headers)
      
      if (csrfToken) {
        headersObj.set(CSRF_TOKEN_HEADER, csrfToken)
      }

      return headersObj
    },
    [token, refreshToken]
  )

  /**
   * Fetch with CSRF token automatically included
   * Matches middleware.ts behavior (only for mutations)
   */
  const fetchWithCsrf = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const method = (options.method || 'GET').toUpperCase()
      const headers = await addToHeaders(options.headers, method)
      
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important: include cookies
      })
    },
    [addToHeaders]
  )

  return {
    token,
    isLoading,
    error,
    refreshToken,
    addToHeaders,
    fetchWithCsrf,
  }
}

