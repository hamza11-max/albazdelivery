import type { NextRequest } from "next/server"
import { eventEmitter } from "@/lib/events"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const role = searchParams.get("role")
  const userId = searchParams.get("userId")

  console.log("[v0] SSE connection request - role:", role, "userId:", userId)

  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      console.log("[v0] SSE stream started for role:", role)

      const sendMessage = (data: any) => {
        if (isClosed) return
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error("[v0] Error sending SSE message:", error)
        }
      }

      // Send connection confirmation
      sendMessage({ type: "connected", timestamp: new Date().toISOString() })

      const listeners: Array<() => void> = []

      if (role === "vendor") {
        const orderCreatedListener = (eventData: any) => {
          sendMessage({ type: "order_created", ...eventData })
        }
        eventEmitter.on("order_created", orderCreatedListener)
        listeners.push(() => eventEmitter.off("order_created", orderCreatedListener))
      }

      if (role === "driver") {
        const orderReadyListener = (eventData: any) => {
          if (eventData.order?.status === "ready") {
            sendMessage({ type: "order_ready", ...eventData })
          }
        }
        eventEmitter.on("order_updated", orderReadyListener)
        listeners.push(() => eventEmitter.off("order_updated", orderReadyListener))
      }

      if (role === "customer") {
        const orderUpdatedListener = (eventData: any) => {
          if (eventData.order?.customerId === userId) {
            sendMessage({ type: "order_updated", ...eventData })
          }
        }
        eventEmitter.on("order_updated", orderUpdatedListener)
        listeners.push(() => eventEmitter.off("order_updated", orderUpdatedListener))
      }

      const heartbeat = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeat)
          return
        }
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch (error) {
          console.error("[v0] Heartbeat error:", error)
          clearInterval(heartbeat)
        }
      }, 15000)

      const cleanup = () => {
        if (isClosed) return
        isClosed = true
        console.log("[v0] SSE connection closing for role:", role)
        clearInterval(heartbeat)
        listeners.forEach((cleanupFn) => cleanupFn())
        try {
          controller.close()
        } catch (error) {
          // Ignore close errors
        }
      }

      request.signal?.addEventListener("abort", cleanup)

      setTimeout(cleanup, 5 * 60 * 1000)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
