import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for route optimization
const optimizeRouteSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
  orderIds: z.array(z.string().cuid('Invalid order ID')).min(1, 'At least one order is required'),
})

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only admins and drivers can optimize routes
    if (session.user.role !== 'ADMIN' && session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only admins and drivers can optimize routes')
    }

    // If driver, verify they can only optimize their own routes
    if (session.user.role === 'DRIVER' && session.user.id) {
      // Verify driver exists and is active
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
      })
      if (!driver) {
        throw new ForbiddenError('Driver profile not found')
      }
    }

    const body = await request.json()
    const validatedData = optimizeRouteSchema.parse(body)
    const { driverId, orderIds } = validatedData

    // Verify all orders exist and are in a deliverable state
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        status: { in: ['READY', 'ASSIGNED'] },
      },
      include: {
        deliveryAddress: true,
      },
    })

    if (orders.length !== orderIds.length) {
      return errorResponse(new Error('Some orders are invalid or not ready for delivery'), 400)
    }

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
      include: {
        location: true,
      },
    })

    if (!driver) {
      return errorResponse(new Error('Driver not found'), 404)
    }

    // Simple route optimization algorithm
    // In production, this would use a proper routing algorithm (e.g., Google Maps API, OR-Tools)
    // For now, we'll sort orders by estimated delivery time
    const optimizedSequence = orderIds.sort()

    // Calculate estimated time and distance
    // Base: 7 minutes per delivery + 2.5km per delivery
    const estimatedTime = orders.length * 7 // 7 min per delivery
    const totalDistance = orders.length * 2.5 // 2.5km per delivery (average)

    return successResponse({
      route: {
        driverId,
        orderIds,
        optimizedSequence,
        totalDistance,
        estimatedTime,
        ordersCount: orders.length,
        message: 'Route optimized (basic algorithm - use mapping service for production)',
      },
    })
  } catch (error) {
    console.error('[API] Route optimization error:', error)
    return errorResponse(error)
  }
}
