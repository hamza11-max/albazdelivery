'use client'

import { useQuery } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api-client'
import type { Order } from '@albaz/shared'

export interface OrdersQueryParams {
  status?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch orders with React Query caching
 */
export function useOrdersQuery(params?: OrdersQueryParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await ordersAPI.list(params)
      return (response.data as { orders: Order[]; pagination?: any }).orders
    },
    staleTime: 1000 * 30, // 30 seconds (orders change frequently)
  })
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrderQuery(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const response = await ordersAPI.getById(orderId)
      return (response.data as { order: Order }).order
    },
    enabled: !!orderId,
    staleTime: 1000 * 10, // 10 seconds (order status changes frequently)
    refetchInterval: (query) => {
      // Auto-refetch if order is not in final state
      const order = query.state.data as Order | null
      if (order && !['DELIVERED', 'CANCELLED'].includes(order.status)) {
        return 5000 // Refetch every 5 seconds for active orders
      }
      return false
    },
  })
}

