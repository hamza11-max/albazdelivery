'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories with React Query caching
 * Safely handles cases where QueryClientProvider is not available
 */
export function useCategoriesQuery() {
  // Safe default return value
  const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }
  
  // Check if QueryClient is available first - must call hook unconditionally
  let queryClient: any = null
  try {
    queryClient = useQueryClient()
  } catch (error) {
    // QueryClientProvider is not available - return safe default immediately
    // This prevents useQuery from being called when context is unavailable
    return safeDefault
  }
  
  // If no QueryClient, return safe default
  if (!queryClient || typeof queryClient !== 'object') {
    return safeDefault
  }
  
  // Now safely call useQuery - QueryClient is confirmed available
  // We must call useQuery unconditionally (React hooks rule), but we've verified QueryClient exists
  let queryResult: any = null
  
  try {
    // Call useQuery - it should work now that we've verified QueryClient exists
    queryResult = useQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        try {
          const response = await categoriesAPI.list()
          return (response?.data as { categories: CategoryDefinition[] })?.categories || []
        } catch (error) {
          console.warn('[useCategoriesQuery] Error fetching categories:', error)
          return []
        }
      },
      staleTime: 1000 * 60 * 30, // Categories change rarely, cache for 30 minutes
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useCategoriesQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    console.warn('[useCategoriesQuery] useQuery returned invalid result:', queryResult)
    return safeDefault
  }
  
  // Safely extract properties with defaults
  try {
    return {
      data: (queryResult?.data ?? []) as CategoryDefinition[],
      isLoading: queryResult?.isLoading ?? false,
      error: queryResult?.error ?? null,
      isError: queryResult?.isError ?? false,
      isSuccess: queryResult?.isSuccess ?? false,
    }
  } catch (error) {
    // If destructuring fails, return safe default
    console.warn('[useCategoriesQuery] Error extracting query result:', error)
    return safeDefault
  }
}

