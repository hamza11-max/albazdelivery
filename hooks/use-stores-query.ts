'use client'

import { useQuery } from '@tanstack/react-query'
import { storesAPI } from '../lib/api-client'
import type { Store } from './use-stores'

export interface StoresQueryParams {
  categoryId?: number
  city?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch stores with React Query caching
 */
export function useStoresQuery(params?: StoresQueryParams) {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: async () => {
      const response = await storesAPI.list(params)
      return (response.data as { stores: Store[] }).stores
    },
    enabled: true, // Always enabled, can be conditionally disabled if needed
  })
}

/**
 * Hook to fetch a single store by ID with React Query caching
 */
export function useStoreQuery(storeId: string | null) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      if (!storeId) return null
      const response = await storesAPI.getById(storeId)
      return (response.data as { store: Store }).store
    },
    enabled: !!storeId,
  })
}

