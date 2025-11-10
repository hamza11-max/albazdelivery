import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for batch route optimization
const batchOptimizeSchema = z.object({
  orders: z.array(z.object({
    orderId: z.string().cuid('Invalid order ID'),
    driverId: z.string().cuid('Invalid driver ID').optional(),
  })).min(1, 'At least one order is required'),
  optimizationStrategy: z.enum(['DISTANCE', 'TIME', 'BALANCED']).optional().default('BALANCED'),
})

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only admins and drivers can batch-optimize routes')
    }

    const body = await request.json()
    const validatedData = batchOptimizeSchema.parse(body)
    const { orders, optimizationStrategy } = validatedData

    const orderIds = orders.map(o => o.orderId)

    // Verify all orders exist and are in a deliverable state
    const ordersData = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        status: { in: ['READY', 'ASSIGNED'] },
      },
      include: {
        deliveryAddress: true,
        store: {
          select: {
            id: true,
            address: true,
            city: true,
          },
        },
      },
    })

    if (ordersData.length !== orderIds.length) {
      return errorResponse(new Error('Some orders are invalid or not ready for delivery'), 400)
    }

    // Get all available drivers with their locations
    const drivers = await prisma.driver.findMany({
      where: {
        location: {
          isActive: true,
        },
      },
      include: {
        location: true,
        _count: {
          select: {
            orders: {
              where: {
                status: { in: ['ASSIGNED', 'IN_DELIVERY'] },
              },
            },
          },
        },
      },
    })

    if (drivers.length === 0) {
      return errorResponse(new Error('No active drivers available'), 400)
    }

    // Group orders by driver if specified, otherwise optimize assignment
    const optimizedRoutes: any[] = []
    const driverOrdersMap = new Map<string, string[]>()

    // If driver IDs are specified, group orders by driver
    orders.forEach(({ orderId, driverId }) => {
      if (driverId) {
        if (!driverOrdersMap.has(driverId)) {
          driverOrdersMap.set(driverId, [])
        }
        driverOrdersMap.get(driverId)!.push(orderId)
      }
    })

    // For orders without specified drivers, assign to least busy driver
    const unassignedOrders = orders
      .filter(o => !o.driverId)
      .map(o => o.orderId)

    // Sort drivers by current workload (least busy first)
    const sortedDrivers = drivers.sort((a, b) => 
      (a._count.orders || 0) - (b._count.orders || 0)
    )

    // Assign unassigned orders to drivers in round-robin fashion
    unassignedOrders.forEach((orderId, index) => {
      const driver = sortedDrivers[index % sortedDrivers.length]
      if (!driverOrdersMap.has(driver.userId)) {
        driverOrdersMap.set(driver.userId, [])
      }
      driverOrdersMap.get(driver.userId)!.push(orderId)
    })

    // Create optimized routes for each driver
    for (const [driverId, orderIdsForDriver] of driverOrdersMap.entries()) {
      const driver = drivers.find(d => d.userId === driverId)
      if (!driver) continue

      const driverOrders = ordersData.filter(o => orderIdsForDriver.includes(o.id))

      // Simple optimization: sort by creation time (first come, first served)
      // In production, this would use a proper routing algorithm (e.g., Google Maps API, OR-Tools)
      const optimizedSequence = driverOrders
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(o => o.id)

      // Calculate estimated metrics
      const estimatedTime = driverOrders.length * 7 // 7 minutes per delivery
      const totalDistance = driverOrders.length * 2.5 // 2.5km per delivery (average)

      optimizedRoutes.push({
        driverId,
        driverName: driver.name,
        orderIds: orderIdsForDriver,
        optimizedSequence,
        totalDistance,
        estimatedTime,
        ordersCount: driverOrders.length,
        currentWorkload: driver._count.orders || 0,
      })
    }

    return successResponse({
      routes: optimizedRoutes,
      totalOrders: ordersData.length,
      totalDrivers: optimizedRoutes.length,
      optimizationStrategy,
      message: 'Batch route optimization completed (basic algorithm - use mapping service for production)',
    })
  } catch (error) {
    console.error('[API] Batch optimization error:', error)
    return errorResponse(error)
  }
}
