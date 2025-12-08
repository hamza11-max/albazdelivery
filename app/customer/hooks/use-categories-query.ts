'use client'

import { useQuery } from '@tanstack/react-query'
import { categoriesAPI } from '../lib/api-client'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories with React Query caching
 */
export function useCategoriesQuery() {
  return useQuery({
    // v2 key to bust stale cached categories/icons
    queryKey: ['categories', 'v2'],
    queryFn: async () => {
      const response = await categoriesAPI.list()
      return (response.data as { categories: CategoryDefinition[] }).categories
    },
    staleTime: 1000 * 60 * 5, // Refresh more often to pick up asset changes
  })
}

