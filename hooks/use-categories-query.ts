'use client'

import { useQuery } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories with React Query caching
 */
export function useCategoriesQuery() {
  let result: any = null
  try {
    result = useQuery({
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
    result = null
  }
  
  // Ensure we always return a valid object, even during static generation
  if (!result || typeof result !== 'object') {
    return { data: [], isLoading: false, error: null, isError: false, isSuccess: false }
  }
  
  return {
    data: result.data ?? [],
    isLoading: result.isLoading ?? false,
    error: result.error ?? null,
    isError: result.isError ?? false,
    isSuccess: result.isSuccess ?? false,
  }
}

