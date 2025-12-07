'use client'

import { useState, useEffect } from 'react'
import { storesAPI } from '../lib/api-client'
import { useLoadingStateEnhanced } from './use-loading-state-enhanced'
import { useErrorHandler } from './use-error-handler'

export interface Store {
  id: string
  name: string
  type: string
  rating: number
  deliveryTime: string
  categoryId: number
  address?: string
  city?: string
  phone?: string
  isActive?: boolean
}

export interface StoresResponse {
  stores: Store[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Hook to fetch stores with optional filters
 */
export function useStores(params?: {
  categoryId?: number
  city?: string
  search?: string
  page?: number
  limit?: number
}) {
  const [stores, setStores] = useState<Store[]>([])
  const { isLoading, error, execute } = useLoadingStateEnhanced()
  const { handleApiError } = useErrorHandler()

  useEffect(() => {
    execute(
      async () => {
        const response = await storesAPI.list(params)
        const data = response.data as StoresResponse
        setStores(data.stores || [])
        return data
      },
      {
        onError: (error) => {
          handleApiError(error, { showToast: false })
        },
      }
    )
  }, [params?.categoryId, params?.city, params?.search, params?.page, params?.limit, execute, handleApiError])

  return { stores, isLoading, error }
}

/**
 * Hook to fetch a single store by ID
 */
export function useStore(storeId: string | null) {
  const [store, setStore] = useState<Store | null>(null)
  const { isLoading, error, execute } = useLoadingStateEnhanced()
  const { handleApiError } = useErrorHandler()

  useEffect(() => {
    if (!storeId) {
      setStore(null)
      return
    }

    execute(
      async () => {
        const response = await storesAPI.getById(storeId)
        const data = response.data as { store: Store }
        setStore(data.store)
        return data
      },
      {
        onError: (error) => {
          handleApiError(error, { showToast: false })
        },
      }
    )
  }, [storeId, execute, handleApiError])

  return { store, isLoading, error }
}

