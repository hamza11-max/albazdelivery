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
  
  // Check if QueryClient is available
  let queryClient: any = null
  try {
    queryClient = useQueryClient()
  } catch (error) {
    // QueryClientProvider is not available, return safe default
    return safeDefault
  }
  
  // If QueryClient is not available, return safe default
  if (!queryClient) {
    return safeDefault
  }
  
  // Always call useQuery (hooks must be called unconditionally)
  // But wrap it to ensure we always get a valid result
  let queryResult: any
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
      staleTime: 1000 * 60 * 30, // Categories change rarely, cache for 30 minutes
      retry: false, // Don't retry during build
    })
  } catch (error) {
    // During static generation, useQuery might throw if QueryClientProvider is not available
    console.warn('[useCategoriesQuery] Hook error during static generation:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default immediately
  if (queryResult === undefined || queryResult === null || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (queryResult.data !== undefined ? queryResult.data : []) as CategoryDefinition[],
    isLoading: queryResult.isLoading === true,
    error: queryResult.error ?? null,
    isError: queryResult.isError === true,
    isSuccess: queryResult.isSuccess === true,
  }
}

