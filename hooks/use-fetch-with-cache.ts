import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { LoadingState } from "@/app/vendor/types"
import { getCachedData, setCachedData } from "@/lib/api-cache"

interface ApiResponse<T> {
  success: boolean
  data: T
}

export function useFetchWithCache() {
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
    const cached = getCachedData(cacheKey)
    if (cached) {
      return normalize ? normalize(cached) : cached
    }
    
    try {
      const response = await fetch(url)
      const data: ApiResponse<T> = await response.json()
      
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
      const expired = getCachedData(cacheKey)
      if (expired) {
        return normalize ? normalize(expired) : expired
      }
      
      return null
    } finally {
      setLoadingState(prev => ({ ...prev, [key]: false }))
    }
  }

  return {
    loadingState,
    fetchData
  }
}