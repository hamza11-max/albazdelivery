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
        console.log("[v0] SSE failed multiple times, switching to polling fallback")
        setUsePolling(true)
        setError(null)
        return
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      try {
        console.log("[v0] SSE connecting to:", url)
        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          setIsConnected(true)
          setError(null)
          reconnectAttemptsRef.current = 0
          console.log("[v0] SSE connection opened")
        }

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data)
            setData(parsedData)
            console.log("[v0] SSE message received:", parsedData.type)
          } catch (err) {
            console.error("[v0] Error parsing SSE data:", err)
          }
        }

        eventSource.onerror = (err) => {
          console.error("[v0] SSE error, readyState:", eventSource.readyState)
          setIsConnected(false)

          if (eventSource.readyState === EventSource.CLOSED) {
            console.log("[v0] SSE connection closed")
            eventSource.close()

            if (reconnectAttemptsRef.current < 3) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
              reconnectAttemptsRef.current++
              console.log(`[v0] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

              reconnectTimeoutRef.current = setTimeout(() => {
                connect()
              }, delay)
            } else {
              console.log("[v0] Max reconnection attempts reached, switching to polling")
              setUsePolling(true)
            }
          }
        }
      } catch (err) {
        console.error("[v0] Error creating EventSource:", err)
        setError(err as Error)
        setIsConnected(false)
        setUsePolling(true)
      }
    }

    if (!usePolling) {
      connect()
    }

    return () => {
      console.log("[v0] SSE cleanup")
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
        console.log("[v0] SSE connection closed")
      }
    }
  }, [url, enabled, usePolling])

  return { data, error, isConnected: isConnected || usePolling }
}
