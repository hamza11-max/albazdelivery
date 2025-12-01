'use client'

import { useQuery } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories with React Query caching
 */
export function useCategoriesQuery() {
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
  
  // Ensure we always return a valid object, even during static generation
  return result || { data: [], isLoading: false, error: null }
}

