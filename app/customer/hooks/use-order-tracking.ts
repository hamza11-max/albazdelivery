'use client'

import { useQuery } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api-client'

type TrackPayload = {
  order?: {
    id: string
    status: string
  }
  tracking?: {
    currentLocation?: any
    lastUpdated?: string
    driver?: {
      id: string
      name: string
      phone?: string
      vehicleType?: string
    }
    estimatedDeliveryTime?: number
  }
  message?: string
}

/**
 * Lightweight hook to poll the tracking endpoint for a single order.
 * Refetches more frequently while the order is not in a terminal state.
 */
export function useOrderTracking(orderId: string | null) {
  return useQuery<TrackPayload | null>({
    queryKey: ['order-track', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const response = await ordersAPI.track(orderId)
      return (response.data as TrackPayload) || null
    },
    enabled: !!orderId,
    staleTime: 5000,
    refetchInterval: (query) => {
      const data = query.state.data
      const status = data?.order?.status
      if (status && !['DELIVERED', 'CANCELLED'].includes(status)) {
        return 5000
      }
      return false
    },
  })
}

