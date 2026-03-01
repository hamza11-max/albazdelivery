"use client"

import { useEffect, useState, useRef } from "react"

export function useSSE(url: string, enabled = true) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [usePolling, setUsePolling] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const connect = () => {
      if (reconnectAttemptsRef.current >= 3) {
        if (process.env.NODE_ENV === 'development') console.log("[SSE] Failed multiple times, switching to polling")
        setUsePolling(true)
        setError(null)
        return
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      try {
        if (process.env.NODE_ENV === 'development') console.log("[SSE] Connecting to:", url)
        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          setIsConnected(true)
          setError(null)
          reconnectAttemptsRef.current = 0
          if (process.env.NODE_ENV === 'development') console.log("[SSE] Connection opened")
        }

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data)
            setData(parsedData)
            if (process.env.NODE_ENV === 'development') console.log("[SSE] Message:", parsedData.type)
          } catch (err) {
            if (process.env.NODE_ENV === 'development') console.error("[SSE] Parse error:", err)
          }
        }

        eventSource.onerror = (err) => {
          if (process.env.NODE_ENV === 'development') console.error("[SSE] Error, readyState:", eventSource.readyState)
          setIsConnected(false)

          if (eventSource.readyState === EventSource.CLOSED) {
            if (process.env.NODE_ENV === 'development') console.log("[SSE] Connection closed")
            eventSource.close()

            if (reconnectAttemptsRef.current < 3) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
              reconnectAttemptsRef.current++
              if (process.env.NODE_ENV === 'development') console.log(`[SSE] Reconnecting in ${delay}ms`)

              reconnectTimeoutRef.current = setTimeout(() => {
                connect()
              }, delay)
            } else {
              if (process.env.NODE_ENV === 'development') console.log("[SSE] Max reconnection attempts, switching to polling")
              setUsePolling(true)
            }
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error("[SSE] EventSource error:", err)
        setError(err as Error)
        setIsConnected(false)
        setUsePolling(true)
      }
    }

    if (!usePolling) {
      connect()
    }

    return () => {
      if (process.env.NODE_ENV === 'development') console.log("[SSE] Cleanup")
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setIsConnected(false)
        if (process.env.NODE_ENV === 'development') console.log("[SSE] Connection closed")
      }
    }
  }, [url, enabled, usePolling])

  return { data, error, isConnected: isConnected || usePolling }
}
