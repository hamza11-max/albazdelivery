import type { NextRequest } from "next/server"
import { eventEmitter } from "@/lib/events"
import { auth } from "@/lib/auth"
import { UnauthorizedError, ForbiddenError } from "@/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_CONNECTION_TIME = 30 * 60 * 1000 // 30 minutes
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (more permissive for SSE connections)
    applyRateLimit(request, rateLimitConfigs.api)

    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role")?.toLowerCase()
    const userId = session.user.id
    const userRole = session.user.role.toLowerCase()

    // Validate role parameter matches user's actual role
    if (role && role !== userRole) {
      return new Response(
        JSON.stringify({ error: "Role mismatch" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    // Use user's actual role if not provided
    const effectiveRole = role || userRole

    // Validate role
    const validRoles = ["vendor", "driver", "customer", "admin"]
    if (!validRoles.includes(effectiveRole)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const encoder = new TextEncoder()
    let isClosed = false
    let heartbeatInterval: NodeJS.Timeout | null = null
    let connectionTimeout: NodeJS.Timeout | null = null

    const stream = new ReadableStream({
      start(controller) {
        const sendMessage = (data: any) => {
          if (isClosed) return
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            // Connection closed, ignore
            isClosed = true
          }
        }

        // Send connection confirmation
        sendMessage({
          type: "connected",
          role: effectiveRole,
          userId,
          timestamp: new Date().toISOString(),
        })

        const listeners: Array<() => void> = []

        // Set up event listeners based on role
        if (effectiveRole === "vendor" || effectiveRole === "admin") {
          const orderCreatedListener = (eventData: any) => {
            // Only send orders for this vendor
            if (effectiveRole === "vendor" && eventData.order?.vendorId !== userId) {
              return
            }
            sendMessage({ type: "order_created", ...eventData })
          }
          eventEmitter.on("order_created", orderCreatedListener)
          listeners.push(() => eventEmitter.off("order_created", orderCreatedListener))

          const orderUpdatedListener = (eventData: any) => {
            if (effectiveRole === "vendor" && eventData.order?.vendorId !== userId) {
              return
            }
            sendMessage({ type: "order_updated", ...eventData })
          }
          eventEmitter.on("order_updated", orderUpdatedListener)
          listeners.push(() => eventEmitter.off("order_updated", orderUpdatedListener))
        }

        if (effectiveRole === "driver" || effectiveRole === "admin") {
          const orderReadyListener = (eventData: any) => {
            if (eventData.order?.status === "READY" || eventData.order?.status === "ready") {
              sendMessage({ type: "order_ready", ...eventData })
            }
          }
          eventEmitter.on("order_updated", orderReadyListener)
          listeners.push(() => eventEmitter.off("order_updated", orderReadyListener))

          const orderAssignedListener = (eventData: any) => {
            if (eventData.driverId === userId || effectiveRole === "admin") {
              sendMessage({ type: "order_assigned", ...eventData })
            }
          }
          eventEmitter.on("order_assigned", orderAssignedListener)
          listeners.push(() => eventEmitter.off("order_assigned", orderAssignedListener))
        }

        if (effectiveRole === "customer" || effectiveRole === "admin") {
          const orderUpdatedListener = (eventData: any) => {
            if (eventData.order?.customerId === userId || effectiveRole === "admin") {
              sendMessage({ type: "order_updated", ...eventData })
            }
          }
          eventEmitter.on("order_updated", orderUpdatedListener)
          listeners.push(() => eventEmitter.off("order_updated", orderUpdatedListener))

          const notificationListener = (eventData: any) => {
            if (eventData.notification?.recipientId === userId || effectiveRole === "admin") {
              sendMessage({ type: "notification", ...eventData })
            }
          }
          eventEmitter.on("notification_sent", notificationListener)
          listeners.push(() => eventEmitter.off("notification_sent", notificationListener))
        }

        // Cleanup function
        const cleanup = () => {
          if (isClosed) return
          isClosed = true

          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            heartbeatInterval = null
          }

          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
            connectionTimeout = null
          }

          listeners.forEach((cleanupFn) => cleanupFn())

          try {
            controller.close()
          } catch (error) {
            // Ignore close errors
          }
        }

        // Heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (isClosed) {
            if (heartbeatInterval) clearInterval(heartbeatInterval)
            return
          }
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"))
          } catch (error) {
            cleanup()
          }
        }, HEARTBEAT_INTERVAL)

        // Auto-close connection after max time
        connectionTimeout = setTimeout(() => {
          cleanup()
        }, MAX_CONNECTION_TIME)

        // Handle client disconnect
        request.signal?.addEventListener("abort", cleanup)
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
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
