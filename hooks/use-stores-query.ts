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

// Safe default return value
const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }

/**
 * Hook to fetch stores with React Query caching
 */
export function useStoresQuery(params?: StoresQueryParams) {
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
      queryKey: ['stores', params],
      queryFn: async () => {
        if (!hasQueryClient) return []
        try {
          const response = await storesAPI.list(params)
          return (response?.data as { stores: Store[] })?.stores || []
        } catch (error) {
          console.warn('[useStoresQuery] Error fetching stores:', error)
          return []
        }
      },
      enabled: hasQueryClient, // Only enable if QueryClient is available
      retry: false, // Don't retry during build
    })
    queryResult = result
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
  // Double-check that queryResult is valid before accessing properties
  try {
    const result = {
      data: (queryResult?.data ?? []) as Store[],
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
    // Ensure we always return a valid object
    return result || safeDefault
  } catch (error) {
    console.warn('[useStoresQuery] Error extracting query result:', error)
    return safeDefault
  }
}

// Safe default for single store query
const safeDefaultStore = { data: null, isLoading: false, error: null, isError: false, isSuccess: false }

/**
 * Hook to fetch a single store by ID with React Query caching
 * Safely handles cases where QueryClientProvider is not available
 */
export function useStoreQuery(storeId: string | null) {
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
      queryKey: ['store', storeId],
      queryFn: async () => {
        if (!hasQueryClient || !storeId) return null
        try {
          const response = await storesAPI.getById(storeId)
          return (response?.data as { store: Store })?.store || null
        } catch (error) {
          console.warn('[useStoreQuery] Error fetching store:', error)
          return null
        }
      },
      enabled: hasQueryClient && Boolean(storeId), // Only enable if QueryClient is available and storeId exists
      retry: false, // Don't retry during build
    })
    queryResult = result
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useStoreQuery] useQuery threw error:', error)
    return safeDefaultStore
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefaultStore
  }
  
  // Safely extract properties with defaults
  // Double-check that queryResult is valid before accessing properties
  try {
    const result = {
      data: (queryResult?.data ?? null) as Store | null,
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
    // Ensure we always return a valid object
    return result || safeDefaultStore
  } catch (error) {
    console.warn('[useStoreQuery] Error extracting query result:', error)
    return safeDefaultStore
  }
}

