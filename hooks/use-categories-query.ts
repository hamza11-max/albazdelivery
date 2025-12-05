'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

// Safe default return value
const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }

/**
 * Hook to fetch categories with React Query caching
 * Safely handles cases where QueryClientProvider is not available
 */
export function useCategoriesQuery() {
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
      queryKey: ['categories'],
      queryFn: async () => {
        if (!hasQueryClient) return []
        try {
          const response = await categoriesAPI.list()
          return (response?.data as { categories: CategoryDefinition[] })?.categories || []
        } catch (error) {
          console.warn('[useCategoriesQuery] Error fetching categories:', error)
          return []
        }
      },
      enabled: hasQueryClient, // Only enable if QueryClient is available
      staleTime: 1000 * 60 * 30, // Categories change rarely, cache for 30 minutes
      retry: false, // Don't retry during build
    })
    queryResult = result
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useCategoriesQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults - use optional chaining everywhere
  // Double-check that queryResult is valid before accessing properties
  try {
    const result = {
      data: (queryResult?.data ?? []) as CategoryDefinition[],
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
    // Ensure we always return a valid object
    return result || safeDefault
  } catch (error) {
    // If destructuring fails, return safe default
    console.warn('[useCategoriesQuery] Error extracting query result:', error)
    return safeDefault
  }
}

