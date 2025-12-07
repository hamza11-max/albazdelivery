/**
 * React Hooks for API Data Fetching
 * Provides loading states, error handling, and data caching
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ordersAPI,
  walletAPI,
  loyaltyAPI,
  notificationsAPI,
  driverAPI,
  adminAPI,
  productsAPI,
  type APIError,
} from '@/lib/api-client'

// ============================================
// GENERIC HOOK FOR API CALLS
// ============================================

export function useAPIData<T>(
  fetchFn: () => Promise<{ data: T }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFn()
      setData(response.data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch }
}

// ============================================
// ORDERS HOOKS
// ============================================

export function useOrders(status?: string) {
  const { data: session } = useSession()
  
  return useAPIData(
    () => ordersAPI.list({ status }),
    [session?.user?.id, status]
  )
}

export function useOrder(orderId: string | null) {
  return useAPIData(
    () => {
      if (!orderId) throw new Error('Order ID is required')
      return ordersAPI.getById(orderId)
    },
    [orderId]
  )
}

// ============================================
// WALLET HOOKS
// ============================================

export function useWallet() {
  const { data: session } = useSession()
  
  return useAPIData(
    () => walletAPI.getBalance(),
    [session?.user?.id]
  )
}

export function useWalletTransactions() {
  const { data: session } = useSession()
  
  return useAPIData(
    () => walletAPI.getTransactions(),
    [session?.user?.id]
  )
}

// ============================================
// LOYALTY HOOKS
// ============================================

export function useLoyaltyAccount() {
  const { data: session } = useSession()
  
  return useAPIData(
    () => loyaltyAPI.getAccount(),
    [session?.user?.id]
  )
}

export function useLoyaltyRewards() {
  return useAPIData(
    () => loyaltyAPI.getRewards(),
    []
  )
}

export function useLoyaltyTransactions() {
  const { data: session } = useSession()
  
  return useAPIData(
    () => loyaltyAPI.getTransactions(),
    [session?.user?.id]
  )
}

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

export function useNotifications(page: number = 1, limit: number = 20) {
  const { data: session } = useSession()
  
  return useAPIData(
    () => notificationsAPI.list({ page, limit }),
    [session?.user?.id, page, limit]
  )
}

// ============================================
// DRIVER HOOKS
// ============================================

export function useDriverDeliveries(status?: string) {
  const { data: session } = useSession()
  
  return useAPIData(
    () => driverAPI.getDeliveries(status),
    [session?.user?.id, status]
  )
}

export function useDriverLocation(driverId?: string, orderId?: string) {
  return useAPIData(
    () => driverAPI.getLocation(driverId, orderId),
    [driverId, orderId]
  )
}

// ============================================
// ADMIN HOOKS
// ============================================

export function useUsers(params?: { role?: string; status?: string; page?: number }) {
  return useAPIData(
    () => adminAPI.getUsers(params),
    [params?.role, params?.status, params?.page]
  )
}

export function useRegistrationRequests(params?: { status?: string; role?: string }) {
  return useAPIData(
    () => adminAPI.getRegistrationRequests(params),
    [params?.status, params?.role]
  )
}

// ============================================
// PRODUCTS HOOKS
// ============================================

export function useProducts(params?: { storeId?: string; search?: string }) {
  return useAPIData(
    () => productsAPI.list(params),
    [params?.storeId, params?.search]
  )
}

// ============================================
// MUTATION HOOKS (for actions)
// ============================================

export function useAPIAction<T extends any[], R>(
  actionFn: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<R | null>(null)

  const execute = async (...args: T) => {
    setLoading(true)
    setError(null)
    try {
      const result = await actionFn(...args)
      setData(result)
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setLoading(false)
    setError(null)
    setData(null)
  }

  return { execute, loading, error, data, reset }
}

// Usage examples for actions:
export const useCreateOrder = () => useAPIAction(ordersAPI.create)
export const useUpdateOrderStatus = () => useAPIAction(ordersAPI.updateStatus)
export const useAcceptDelivery = () => useAPIAction(driverAPI.acceptDelivery)
export const useUpdateDeliveryStatus = () => useAPIAction(driverAPI.updateDeliveryStatus)
export const useMarkNotificationRead = () => useAPIAction(notificationsAPI.markAsRead)
export const useDeleteNotifications = () => useAPIAction(notificationsAPI.delete)
export const useRedeemReward = () => useAPIAction(loyaltyAPI.redeemReward)
export const useProcessRegistrationRequest = () => useAPIAction(adminAPI.processRegistrationRequest)
