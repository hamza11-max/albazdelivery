'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api-client'
import type { Order } from '@albaz/shared'

export interface OrdersQueryParams {
  status?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch orders with React Query caching
 * Safely handles cases where QueryClientProvider is not available
 */
export function useOrdersQuery(params?: OrdersQueryParams) {
  // Safe default return value
  const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }
  
  // Check if QueryClient is available - must call hook unconditionally
  let hasQueryClient = false
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined && typeof queryClient === 'object'
  } catch (error) {
    // QueryClientProvider is not available
    hasQueryClient = false
  }
  
  // ALWAYS call useQuery (React hooks rule) but disable it if QueryClient is not available
  let queryResult: any = null
  
  try {
    queryResult = useQuery({
      queryKey: ['orders', params],
      queryFn: async () => {
        const response = await ordersAPI.list(params)
        return (response.data as { orders: Order[]; pagination?: any }).orders
      },
      enabled: hasQueryClient, // Only run if QueryClient is available
      staleTime: 1000 * 30, // 30 seconds (orders change frequently)
      retry: false,
    })
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useOrdersQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (queryResult?.data ?? []) as Order[],
    isLoading: queryResult?.isLoading ?? false,
    error: queryResult?.error ?? null,
    isError: queryResult?.isError ?? false,
    isSuccess: queryResult?.isSuccess ?? false,
  }
}

/**
 * Hook to fetch a single order by ID
 * Safely handles cases where QueryClientProvider is not available
 */
export function useOrderQuery(orderId: string | null) {
  // Safe default return value
  const safeDefault = { data: null, isLoading: false, error: null, isError: false, isSuccess: false }
  
  // Check if QueryClient is available - must call hook unconditionally
  let hasQueryClient = false
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined && typeof queryClient === 'object'
  } catch (error) {
    // QueryClientProvider is not available
    hasQueryClient = false
  }
  
  // ALWAYS call useQuery (React hooks rule) but disable it if QueryClient is not available
  let queryResult: any = null
  
  try {
    queryResult = useQuery({
      queryKey: ['order', orderId],
      queryFn: async () => {
        if (!orderId) return null
        const response = await ordersAPI.getById(orderId)
        return (response.data as { order: Order }).order
      },
      enabled: hasQueryClient && !!orderId, // Only run if QueryClient is available AND orderId is provided
      staleTime: 1000 * 10, // 10 seconds (order status changes frequently)
      retry: false,
      refetchInterval: (query) => {
        // Auto-refetch if order is not in final state
        const order = query.state.data as Order | null
        if (order && !['DELIVERED', 'CANCELLED'].includes(order.status)) {
          return 5000 // Refetch every 5 seconds for active orders
        }
        return false
      },
    })
  } catch (error) {
    // If useQuery throws, return safe default
    console.warn('[useOrderQuery] useQuery threw error:', error)
    return safeDefault
  }
  
  // If useQuery returned undefined or null, return safe default
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  // Safely extract properties with defaults
  return {
    data: (queryResult?.data ?? null) as Order | null,
    isLoading: queryResult?.isLoading ?? false,
    error: queryResult?.error ?? null,
    isError: queryResult?.isError ?? false,
    isSuccess: queryResult?.isSuccess ?? false,
  }
}

