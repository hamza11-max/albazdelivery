'use client'

import { useState, useEffect } from 'react'
import { productsAPI } from '../lib/api-client'
import { useLoadingStateEnhanced } from './use-loading-state-enhanced'
import { useErrorHandler } from './use-error-handler'

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  image?: string | null
  rating: number
  available: boolean
  category?: string | null
}

export interface ProductsResponse {
  products: Product[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Hook to fetch products for a store
 */
export function useProducts(storeId: string | null, params?: {
  search?: string
  available?: boolean
  page?: number
  limit?: number
}) {
  const [products, setProducts] = useState<Product[]>([])
  const { isLoading, error, execute } = useLoadingStateEnhanced()
  const { handleApiError } = useErrorHandler()

  useEffect(() => {
    if (!storeId) {
      setProducts([])
      return
    }

    execute(
      async () => {
        const response = await productsAPI.list({
          storeId,
          ...params,
        })
        const data = response.data as ProductsResponse
        setProducts(data.products || [])
        return data
      },
      {
        onError: (error) => {
          handleApiError(error, { showToast: false })
        },
      }
    )
  }, [storeId, params?.search, params?.available, params?.page, params?.limit, execute, handleApiError])

  return { products, isLoading, error }
}

