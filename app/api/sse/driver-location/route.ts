import { NextRequest } from 'next/server'
import { eventEmitter } from '@/lib/events'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Changed from 'edge' to support Prisma

const MAX_CONNECTION_TIME = 60 * 60 * 1000 // 1 hour for tracking
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const orderId = request.nextUrl.searchParams.get('orderId')
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Validate orderId format
    try {
      z.string().cuid().parse(orderId)
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid order ID format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Verify user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        vendorId: true,
        driverId: true,
      },
    })

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check authorization
    const userId = session.user.id
    const userRole = session.user.role
    const hasAccess =
      userRole === 'ADMIN' ||
      order.customerId === userId ||
      order.vendorId === userId ||
      order.driverId === userId

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    const encoder = new TextEncoder()
    let isClosed = false
    let heartbeatInterval: NodeJS.Timeout | null = null
    let connectionTimeout: NodeJS.Timeout | null = null

    const stream = new ReadableStream({
      start(controller) {
        // Function to send events to the client
        const send = (data: any) => {
          if (isClosed) return
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch (error) {
            isClosed = true
          }
        }

        // Send initial connection message
        send({
          type: 'connected',
          message: 'Tracking started',
          orderId,
          timestamp: new Date().toISOString(),
        })

        // Get initial driver location if available
        if (order.driverId) {
          prisma.driverLocation.findUnique({
            where: { driverId: order.driverId },
            select: {
              latitude: true,
              longitude: true,
              accuracy: true,
              heading: true,
              speed: true,
              updatedAt: true,
            },
          }).then((location) => {
            if (location && !isClosed) {
              send({
                type: 'location',
                orderId,
                driverId: order.driverId,
                location: {
                  lat: location.latitude,
                  lng: location.longitude,
                  accuracy: location.accuracy,
                  heading: location.heading,
                  speed: location.speed,
                },
                timestamp: location.updatedAt.toISOString(),
              })
            }
          }).catch(() => {
            // Ignore errors
          })
        }

        // Listen for driver location updates
        const handleLocationUpdate = (data: any) => {
          // Send updates for the driver of this order
          if (data.driverId === order.driverId || data.orderId === orderId) {
            send({
              type: 'location',
              orderId,
              driverId: data.driverId || order.driverId,
              location: data.location,
              timestamp: data.timestamp || new Date().toISOString(),
            })
          }
        }

        // Register event listener
        eventEmitter.on('driver_location_updated', handleLocationUpdate)

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

          eventEmitter.off('driver_location_updated', handleLocationUpdate)

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
        request.signal?.addEventListener('abort', cleanup)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}