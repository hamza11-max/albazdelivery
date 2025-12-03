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
    console.warn('[useStoresQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (queryResult?.data ?? []) as Store[],
    isLoading: queryResult?.isLoading ?? false,
    error: queryResult?.error ?? null,
    isError: queryResult?.isError ?? false,
    isSuccess: queryResult?.isSuccess ?? false,
  }
}

/**
 * Hook to fetch a single store by ID with React Query caching
 * Safely handles cases where QueryClientProvider is not available
 */
export function useStoreQuery(storeId: string | null) {
  // Safe default return value
  const safeDefault = { data: null, isLoading: false, error: null, isError: false, isSuccess: false }
  
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
  let queryResult: any = null
  
  try {
    queryResult = useQuery({
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
      enabled: hasQueryClient && !!storeId, // Only run if QueryClient is available AND storeId is provided
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useStoreQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (queryResult?.data ?? null) as Store | null,
    isLoading: queryResult?.isLoading ?? false,
    error: queryResult?.error ?? null,
    isError: queryResult?.isError ?? false,
    isSuccess: queryResult?.isSuccess ?? false,
  }
}

