'use client'

import { useQuery } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories with React Query caching
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list()
      return (response.data as { categories: CategoryDefinition[] }).categories
    },
    staleTime: 1000 * 60 * 30, // Categories change rarely, cache for 30 minutes
  })
}

