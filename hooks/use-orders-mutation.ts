'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api-client'
import { useErrorHandler } from './use-error-handler'

export interface CreateOrderData {
  storeId: string
  items: Array<{ productId: string; quantity: number; price: number }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  deliveryAddress: string
  city: string
  customerPhone: string
}

/**
 * Hook for creating orders with React Query mutation
 * Includes optimistic updates and error handling
 */
export function useCreateOrder() {
  let queryClient: any = null
  try {
    queryClient = useQueryClient()
  } catch (error) {
    // QueryClientProvider is not available
    console.warn('[useCreateOrder] QueryClient not available')
  }
  
  const { handleApiError } = useErrorHandler()

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const response = await ordersAPI.create(orderData)
      return response.data as { order: any }
    },
    onSuccess: (data) => {
      // Invalidate orders queries to refetch
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        
        // Optionally set the new order in cache
        if (data.order?.id) {
          queryClient.setQueryData(['order', data.order.id], data.order)
        }
      }
    },
    onError: (error) => {
      handleApiError(error, { showToast: true })
    },
  })
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const { handleApiError } = useErrorHandler()

  return useMutation({
    mutationFn: async ({ orderId, status, driverId }: { orderId: string; status: string; driverId?: string }) => {
      const response = await ordersAPI.updateStatus(orderId, status, driverId)
      return response.data as { order: any }
    },
    onSuccess: (data, variables) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      // Optimistically update the order in cache
      if (data.order) {
        queryClient.setQueryData(['order', variables.orderId], data.order)
      }
    },
    onError: (error) => {
      handleApiError(error, { showToast: true })
    },
  })
}

