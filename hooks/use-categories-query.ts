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
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined
  } catch (error) {
    // QueryClientProvider is not available - return safe default immediately
    return safeDefault
  }
  
  // If no QueryClient, return safe default
  if (!hasQueryClient) {
    return safeDefault
  }
  
  // Now safely call useQuery - QueryClient is confirmed available
  // Wrap in try-catch as extra safety
  let queryResult: any = safeDefault
  
  try {
    const result = useQuery({
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
    
    // Ensure result is valid
    if (result && typeof result === 'object' && result !== null) {
      queryResult = result
    }
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useCategoriesQuery] Hook error:', error)
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

