'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage {
  type: string
  data?: any
  order?: any
  store?: any
  product?: any
}

export interface UseWebSocketOptions {
  enabled?: boolean
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

/**
 * Hook for WebSocket connection with automatic reconnection
 */
export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    enabled = true,
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const optionsRef = useRef(options)

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const connect = useCallback(() => {
    if (!url || !enabled) return

    try {
      // Convert HTTP/HTTPS to WS/WSS
      const wsUrl = url.replace(/^http/, 'ws')
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setIsConnected(true)
        setReconnectAttempts(0)
        optionsRef.current.onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          optionsRef.current.onMessage?.(message)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        optionsRef.current.onError?.(error)
      }

      ws.onclose = () => {
        setIsConnected(false)
        optionsRef.current.onClose?.()

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1)
            connect()
          }, reconnectInterval)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
    }
  }, [url, enabled, reconnectInterval, maxReconnectAttempts, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[WebSocket] Cannot send message: not connected')
    }
  }, [])

  useEffect(() => {
    if (enabled && url) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, url, connect, disconnect])

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect,
  }
}

