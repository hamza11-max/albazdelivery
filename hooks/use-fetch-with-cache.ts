import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { getCachedData, setCachedData } from "@/lib/api-cache"

// Define LoadingState locally to avoid circular dependencies
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
  const { toast } = useToast()
  const [loadingState, setLoadingState] = useState<LoadingState>({
    sales: false,
    customers: false,
    suppliers: false,
    products: false,
    orders: false,
    categories: false,
    dashboard: false,
    inventory: false
  })

  const fetchData = async <T>(
    key: keyof LoadingState,
    url: string,
    cacheKey: string,
    normalize?: (data: T) => any
  ) => {
    setLoadingState(prev => ({ ...prev, [key]: true }))
    
    // Try to use cached data first
    const cached = getCachedData<T>(cacheKey)
    if (cached) {
      return normalize ? normalize(cached) : cached
    }
    
    try {
      const response = await fetch(url)
      const data: CacheApiResponse<T> = await response.json()
      
      if (!data.success) {
        throw new Error("Failed to fetch data")
      }
      
      // Cache successful responses
      setCachedData(cacheKey, data.data)
      
      return normalize ? normalize(data.data) : data.data
    } catch (error) {
      console.error(`[v0] Error fetching ${key}:`, error)
      toast({
        title: `Erreur des ${key}`,
        description: `Impossible de charger la liste des ${key}. Réessayez plus tard.`,
        variant: "destructive",
      })
      
      // Try to return cached data even if it's expired
      const expired = getCachedData<T>(cacheKey)
      if (expired) {
        return normalize ? normalize(expired) : expired
      }
      
      return null as T | null
    } finally {
      setLoadingState(prev => ({ ...prev, [key]: false }))
    }
  }

  return {
    loadingState,
    fetchData,
    fetchWithCache: async <T>(key: string, url: string): Promise<T> => {
      const cached = getCachedData<T>(key)
      if (cached) return cached
      
      const response = await fetch(url)
      const data: CacheApiResponse<T> = await response.json()
      
      if (!data.success) {
        throw new Error("Failed to fetch data")
      }
      
      setCachedData(key, data.data)
      return data.data
    }
  }
}