'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from './use-websocket'
import { useSession } from 'next-auth/react'

/**
 * Hook for real-time updates via WebSocket
 * Automatically invalidates React Query cache on updates
 */
export function useRealtimeUpdates(enabled: boolean = true) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'order_updated':
        // Invalidate orders queries
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['order', message.data?.orderId] })
        break

      case 'store_updated':
        // Invalidate stores queries
        queryClient.invalidateQueries({ queryKey: ['stores'] })
        queryClient.invalidateQueries({ queryKey: ['store', message.data?.storeId] })
        break

      case 'product_updated':
        // Invalidate products queries
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['products', message.data?.storeId] })
        break

      case 'store_availability_changed':
        // Invalidate stores and products
        queryClient.invalidateQueries({ queryKey: ['stores'] })
        queryClient.invalidateQueries({ queryKey: ['products', message.data?.storeId] })
        break

      case 'product_availability_changed':
        // Invalidate products for the store
        queryClient.invalidateQueries({ queryKey: ['products', message.data?.storeId] })
        break

      default:
        // Unknown message type
        console.warn('[Realtime] Unknown message type:', message.type)
    }
  }

  // Build WebSocket URL
  // Note: Falls back to SSE if WebSocket is not available
  // The backend already has SSE support at /api/notifications/sse
  const wsUrl = userId && enabled && typeof window !== 'undefined'
    ? `${process.env.NEXT_PUBLIC_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host}/api/ws?userId=${userId}&role=customer`
    : null

  const { isConnected, sendMessage } = useWebSocket(wsUrl, {
    enabled: enabled && !!userId,
    onMessage: handleMessage,
    onError: (error) => {
      console.error('[Realtime] WebSocket error:', error)
    },
    onOpen: () => {
      console.log('[Realtime] WebSocket connected')
    },
    onClose: () => {
      console.log('[Realtime] WebSocket disconnected')
    },
  })

  return {
    isConnected,
    sendMessage,
  }
}

