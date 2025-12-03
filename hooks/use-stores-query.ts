'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  
  // Check if QueryClient is available first - must call hook unconditionally
  let hasQueryClient = false
  let queryClient: any = null
  try {
    queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined
  } catch (error) {
    // QueryClientProvider is not available
    hasQueryClient = false
  }
  
  // Always call useQuery (hooks must be called unconditionally)
  // Use 'enabled' to prevent execution if QueryClient isn't ready
  let queryResult: any = null
  
  try {
    queryResult = useQuery({
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
      enabled: hasQueryClient, // Only run if QueryClient is available
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useStoresQuery] Hook error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default immediately
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  try {
    return {
      data: (queryResult?.data ?? []) as Store[],
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
  } catch (error) {
    // If destructuring fails, return safe default
    console.warn('[useStoresQuery] Error extracting query result:', error)
    return safeDefault
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

