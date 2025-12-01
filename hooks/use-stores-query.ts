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
  // Safe default return value
  const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }
  
  // Check if useQuery is available (might not be during static generation)
  if (!useQuery || typeof useQuery !== 'function') {
    return safeDefault
  }
  
  let result: any = null
  try {
    result = useQuery({
      queryKey: ['stores', params],
      queryFn: async () => {
        try {
          const response = await storesAPI.list(params)
          return (response?.data as { stores: Store[] })?.stores || []
        } catch (error) {
          console.warn('[useStoresQuery] Error fetching stores:', error)
          return []
        }
      },
      enabled: true, // Always enabled, can be conditionally disabled if needed
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // During static generation, useQuery might throw if QueryClientProvider is not available
    console.warn('[useStoresQuery] Hook error during static generation:', error)
    return safeDefault
  }
  
  // Ensure we always return a valid object, even during static generation
  if (!result || typeof result !== 'object' || result === null) {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (result.data !== undefined ? result.data : []) as Store[],
    isLoading: result.isLoading === true,
    error: result.error ?? null,
    isError: result.isError === true,
    isSuccess: result.isSuccess === true,
  }
}

/**
 * Hook to fetch a single store by ID with React Query caching
 */
export function useStoreQuery(storeId: string | null) {
  try {
    const result = useQuery({
      queryKey: ['store', storeId],
      queryFn: async () => {
        if (!storeId) return null
        try {
          const response = await storesAPI.getById(storeId)
          return (response?.data as { store: Store })?.store || null
        } catch (error) {
          console.warn('[useStoreQuery] Error fetching store:', error)
          return null
        }
      },
      enabled: !!storeId,
      retry: false, // Don't retry during build
    })
    
    // Ensure we always return a valid object, even during static generation
    return result || { data: null, isLoading: false, error: null }
  } catch (error) {
    // During static generation, useQuery might throw if QueryClientProvider is not available
    console.warn('[useStoreQuery] Hook error during static generation:', error)
    return { data: null, isLoading: false, error: null }
  }
}

