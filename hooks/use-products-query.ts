'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  
  // Check if QueryClient is available
  let queryClient: any = null
  try {
    queryClient = useQueryClient()
  } catch (error) {
    // QueryClientProvider is not available, return safe default
    return safeDefault
  }
  
  // If QueryClient is not available, return safe default
  if (!queryClient) {
    return safeDefault
  }
  
  // Always call useQuery (hooks must be called unconditionally)
  // But wrap it to ensure we always get a valid result
  let queryResult: any
  try {
    queryResult = useQuery({
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
  
  // If useQuery returned undefined or null, return safe default immediately
  if (queryResult === undefined || queryResult === null || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (queryResult.data !== undefined ? queryResult.data : []) as Product[],
    isLoading: queryResult.isLoading === true,
    error: queryResult.error ?? null,
    isError: queryResult.isError === true,
    isSuccess: queryResult.isSuccess === true,
  }
}

