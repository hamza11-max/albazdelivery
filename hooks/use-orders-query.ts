'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api-client'
import type { Order } from '@albaz/shared'

export interface OrdersQueryParams {
  status?: string
  page?: number
  limit?: number
}

// Safe default return value
const safeDefault = { data: [], isLoading: false, error: null, isError: false, isSuccess: false }

/**
 * Hook to fetch orders with React Query caching
 * Safely handles cases where QueryClientProvider is not available
 */
export function useOrdersQuery(params?: OrdersQueryParams) {
  // Check if QueryClient is available - must call hook unconditionally
  let hasQueryClient = false
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined && typeof queryClient === 'object'
  } catch (error) {
    // QueryClientProvider is not available
    hasQueryClient = false
  }
  
  // ALWAYS call useQuery (React hooks rule) - React Query v5 requires QueryClientProvider
  // If provider is missing, useQuery will throw, so we need to catch it
  let queryResult: any = safeDefault
  
  // We must call useQuery unconditionally, but we can disable it
  try {
    const query = useQuery({
      queryKey: ['orders', params],
      queryFn: async () => {
        if (!hasQueryClient) return []
        const response = await ordersAPI.list(params)
        return (response.data as { orders: Order[]; pagination?: any }).orders
      },
      enabled: hasQueryClient, // Disable if no QueryClient
      staleTime: 1000 * 30, // 30 seconds (orders change frequently)
      retry: false,
    })
    
    // Safely extract properties with defaults
    queryResult = {
      data: (query?.data ?? []) as Order[],
      isLoading: query?.isLoading ?? false,
      error: query?.error ?? null,
      isError: query?.isError ?? false,
      isSuccess: query?.isSuccess ?? false,
    }
  } catch (error: any) {
    // If useQuery throws (e.g., no QueryClientProvider), return safe default
    // This can happen in React Query v5 if provider is missing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useOrdersQuery] useQuery error (QueryClientProvider may be missing):', error?.message)
    }
    queryResult = safeDefault
  }
  
  // Ensure we always return a valid object
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefault
  }
  
  return queryResult
}

// Safe default for single order query
const safeDefaultOrder = { data: null, isLoading: false, error: null, isError: false, isSuccess: false }

/**
 * Hook to fetch a single order by ID
 * Safely handles cases where QueryClientProvider is not available
 */
export function useOrderQuery(orderId: string | null) {
  // Check if QueryClient is available - must call hook unconditionally
  let hasQueryClient = false
  try {
    const queryClient = useQueryClient()
    hasQueryClient = queryClient !== null && queryClient !== undefined && typeof queryClient === 'object'
  } catch (error) {
    // QueryClientProvider is not available
    hasQueryClient = false
  }
  
  // ALWAYS call useQuery (React hooks rule) - React Query v5 requires QueryClientProvider
  let queryResult: any = safeDefaultOrder
  
  // We must call useQuery unconditionally, but we can disable it
  try {
    const query = useQuery({
      queryKey: ['order', orderId],
      queryFn: async () => {
        if (!hasQueryClient || !orderId) return null
        const response = await ordersAPI.getById(orderId)
        return (response.data as { order: Order }).order
      },
      enabled: hasQueryClient && Boolean(orderId), // Disable if no QueryClient
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
    
    // Safely extract properties with defaults
    queryResult = {
      data: (query?.data ?? null) as Order | null,
      isLoading: query?.isLoading ?? false,
      error: query?.error ?? null,
      isError: query?.isError ?? false,
      isSuccess: query?.isSuccess ?? false,
    }
  } catch (error: any) {
    // If useQuery throws (e.g., no QueryClientProvider), return safe default
    // This can happen in React Query v5 if provider is missing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useOrderQuery] useQuery error (QueryClientProvider may be missing):', error?.message)
    }
    queryResult = safeDefaultOrder
  }
  
  // Ensure we always return a valid object
  if (!queryResult || typeof queryResult !== 'object') {
    return safeDefaultOrder
  }
  
  return queryResult
}

