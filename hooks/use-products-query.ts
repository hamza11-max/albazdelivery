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
  return useQuery({
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
}

