'use client'

import { useState, useEffect } from 'react'
import { categoriesAPI } from '../lib/api-client'
import { useLoadingStateEnhanced } from './use-loading-state-enhanced'
import { useErrorHandler } from './use-error-handler'
import type { CategoryDefinition } from '../lib/mock-data'

/**
 * Hook to fetch categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  const { isLoading, error, execute } = useLoadingStateEnhanced()
  const { handleApiError } = useErrorHandler()

  useEffect(() => {
    execute(
      async () => {
        const response = await categoriesAPI.list()
        const data = response.data as { categories: CategoryDefinition[] }
        setCategories(data.categories || [])
        return data
      },
      {
        onError: (error) => {
          handleApiError(error, { showToast: false })
        },
      }
    )
  }, [execute, handleApiError])

  return { categories, isLoading, error }
}

