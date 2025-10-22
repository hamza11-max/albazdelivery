import { NextRequest } from 'next/server'
import { eventEmitter } from '@/lib/events'

// Use the exported eventEmitter instance
const emitter = eventEmitter

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId')
  
  if (!orderId) {
    return new Response('Order ID is required', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Function to send events to the client
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial connection message
      send({ type: 'connected', message: 'Tracking started' })

      // Listen for driver location updates
      const handleLocationUpdate = (data: any) => {
        // Only send updates for the requested order
        if (data.orderId === orderId) {
          send(data)
        }
      }

      // Register event listener
      emitter.on('driver_location_updated', handleLocationUpdate)

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        emitter.off('driver_location_updated', handleLocationUpdate)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  })
}