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
  
  // Check if QueryClient is available first - must call hook unconditionally
  let hasQueryClient = false
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined
  } catch (error) {
    // QueryClientProvider is not available - return safe default immediately
    return safeDefault
  }
  
  // If no QueryClient, return safe default
  if (!hasQueryClient) {
    return safeDefault
  }
  
  // Now safely call useQuery - QueryClient is confirmed available
  // Wrap in try-catch as extra safety
  let queryResult: any = safeDefault
  
  try {
    const result = useQuery({
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
      enabled: !!storeId, // Only run if storeId is provided
      staleTime: 1000 * 60 * 2, // Products may change, cache for 2 minutes
      retry: false, // Don't retry during build
    })
    
    // Ensure result is valid
    if (result && typeof result === 'object' && result !== null) {
      queryResult = result
    }
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useProductsQuery] Hook error:', error)
    return safeDefault
  }
  
  // Safely extract properties with defaults
  try {
    return {
      data: (queryResult?.data ?? []) as Product[],
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
  } catch (error) {
    // If destructuring fails, return safe default
    console.warn('[useProductsQuery] Error extracting query result:', error)
    return safeDefault
  }
}

