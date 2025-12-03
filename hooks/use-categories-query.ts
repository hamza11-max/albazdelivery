'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories with React Query caching
 */
export function useCategoriesQuery() {
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
      enabled: hasQueryClient, // Only run if QueryClient is available
      staleTime: 1000 * 60 * 30, // Categories change rarely, cache for 30 minutes
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useCategoriesQuery] Hook error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default immediately
  if (!queryResult || typeof queryResult !== 'object') {
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

