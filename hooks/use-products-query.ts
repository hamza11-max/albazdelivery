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

// Safe default return value
const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }

/**
 * Hook to fetch products for a store with React Query caching
 */
export function useProductsQuery(storeId: string | null, params?: ProductsQueryParams) {
  // Check if QueryClient is available - must call hook unconditionally
  let hasQueryClient = false
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined && typeof queryClient === 'object'
  } catch (error) {
    // QueryClientProvider is not available
    hasQueryClient = false
  }
  
  // ALWAYS call useQuery (React hooks rule) but disable it if QueryClient is not available
  let queryResult: any = undefined
  
  try {
    // Always call useQuery, but it may return undefined in production if provider is missing
    const result = useQuery({
      queryKey: ['products', storeId, params],
      queryFn: async () => {
        if (!hasQueryClient || !storeId) return []
        try {
          const response = await productsAPI.list({
            storeId: storeId,
            ...params,
          })
          return (response?.data as { products: Product[] })?.products || []
        } catch (error) {
          console.warn('[useProductsQuery] Error fetching products:', error)
          return []
        }
      },
      enabled: hasQueryClient && Boolean(storeId), // Only enable if QueryClient is available and storeId exists
      staleTime: 1000 * 60 * 2, // Products may change, cache for 2 minutes
      retry: false, // Don't retry during build
    })
    queryResult = result
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useProductsQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  // Double-check that queryResult is valid before accessing properties
  try {
    const result = {
      data: (queryResult?.data ?? []) as Product[],
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
    // Ensure we always return a valid object
    return result || safeDefault
  } catch (error) {
    console.warn('[useProductsQuery] Error extracting query result:', error)
    return safeDefault
  }
}

