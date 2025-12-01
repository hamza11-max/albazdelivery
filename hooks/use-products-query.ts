'use client'

import { useQuery } from '@tanstack/react-query'
import { productsAPI } from '../lib/api-client'
import type { Product } from './use-products'

export interface ProductsQueryParams {
  search?: string
  available?: boolean
  page?: number
  limit?: number
}

/**
 * Hook to fetch products for a store with React Query caching
 */
export function useProductsQuery(storeId: string | null, params?: ProductsQueryParams) {
  // Safe default return value
  const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }
  
  // Check if useQuery is available (might not be during static generation)
  if (!useQuery || typeof useQuery !== 'function') {
    return safeDefault
  }
  
  let result: any = null
  try {
    result = useQuery({
      queryKey: ['products', storeId, params],
      queryFn: async () => {
        if (!storeId) return []
        try {
          const response = await productsAPI.list({
            storeId,
            ...params,
          })
          return (response?.data as { products: Product[] })?.products || []
        } catch (error) {
          console.warn('[useProductsQuery] Error fetching products:', error)
          return []
        }
      },
      enabled: !!storeId,
      staleTime: 1000 * 60 * 2, // Products may change, cache for 2 minutes
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // During static generation, useQuery might throw if QueryClientProvider is not available
    console.warn('[useProductsQuery] Hook error during static generation:', error)
    return safeDefault
  }
  
  // Ensure we always return a valid object, even during static generation
  if (!result || typeof result !== 'object' || result === null) {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (result.data !== undefined ? result.data : []) as Product[],
    isLoading: result.isLoading === true,
    error: result.error ?? null,
    isError: result.isError === true,
    isSuccess: result.isSuccess === true,
  }
}

