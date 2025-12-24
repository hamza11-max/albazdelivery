import { useState, useCallback } from "react"
import { getCachedData, setCachedData } from "@/root/lib/api-cache"

// Vendor-local copy of the shared cache hook, without cross-app toast dependency

export interface LoadingState {
  sales: boolean
  customers: boolean
  suppliers: boolean
  products: boolean
  orders: boolean
  categories: boolean
  dashboard: boolean
  inventory: boolean
}

interface CacheApiResponse<T> {
  success: boolean
  data: T
}

export interface FetchWithCacheResult {
  loadingState: LoadingState
  fetchData: <T>(
    key: keyof LoadingState,
    url: string,
    cacheKey: string,
    normalize?: (data: T) => any
  ) => Promise<T | undefined>
  fetchWithCache: <T>(key: string, url: string) => Promise<T>
}

export function useFetchWithCache(): FetchWithCacheResult {
  // Simple console-based error reporting for now (no UI toast dependency)
  const showError = (key: keyof LoadingState, error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(`[vendor] Error fetching ${String(key)}:`, error)
  }

  const [loadingState, setLoadingState] = useState<LoadingState>({
    sales: false,
    customers: false,
    suppliers: false,
    products: false,
    orders: false,
    categories: false,
    dashboard: false,
    inventory: false,
  })

  const fetchData = useCallback(
    async <T>(
      key: keyof LoadingState,
      url: string,
      cacheKey: string,
      normalize?: (data: T) => any,
    ) => {
      setLoadingState((prev) => ({ ...prev, [key]: true }))

      // Try to use cached data first
      const cached = getCachedData<T>(cacheKey)
      if (cached) {
        setLoadingState((prev) => ({ ...prev, [key]: false }))
        return normalize ? normalize(cached) : cached
      }

      // Check for error cache to prevent infinite retries
      const errorCacheKey = `error:${cacheKey}`
      const errorCache = getCachedData<{ timestamp: number }>(errorCacheKey)
      if (errorCache && Date.now() - errorCache.timestamp < 60000) {
        setLoadingState((prev) => ({ ...prev, [key]: false }))
        const expired = getCachedData<T>(cacheKey)
        if (expired) {
          return normalize ? normalize(expired) : expired
        }
        return undefined
      }

      try {
        const response = await fetch(url)

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error")
          throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          throw new Error(
            `Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`,
          )
        }

        const data: CacheApiResponse<T> = await response.json()

        if (!data.success) {
          throw new Error("Failed to fetch data")
        }

        // Cache successful responses
        setCachedData(cacheKey, data.data)

        // Clear any error cache on success
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.removeItem(errorCacheKey)
          }
        } catch {
          // Ignore localStorage errors
        }

        setLoadingState((prev) => ({ ...prev, [key]: false }))
        return normalize ? normalize(data.data) : data.data
      } catch (error) {
        showError(key, error)

        // Cache the error to prevent infinite retries
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(
              errorCacheKey,
              JSON.stringify({ timestamp: Date.now() }),
            )
          }
        } catch {
          // Ignore localStorage errors
        }

        setLoadingState((prev) => ({ ...prev, [key]: false }))

        // Try to return cached data even if it's expired
        const expired = getCachedData<T>(cacheKey)
        if (expired) {
          return normalize ? normalize(expired) : expired
        }

        return undefined
      }
    },
    [],
  )

  const fetchWithCache = useCallback(
    async <T>(key: string, url: string) => {
      const cacheKey = key
      const cached = getCachedData<T>(cacheKey)
      if (cached) {
        return cached
      }

      const response = await fetch(url)
      const data: CacheApiResponse<T> = await response.json()

      if (!data.success) {
        throw new Error("Failed to fetch data")
      }

      setCachedData(cacheKey, data.data)
      return data.data
    },
    [],
  )

  return {
    loadingState,
    fetchData,
    fetchWithCache,
  }
}


