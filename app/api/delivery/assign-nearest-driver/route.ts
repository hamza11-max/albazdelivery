import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderAssigned } from '@/lib/events'
import { z } from 'zod'

// Validation schema for driver assignment
const assignDriverSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  driverId: z.string().cuid('Invalid driver ID').optional(), // Optional: auto-assign if not provided
})

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'VENDOR') {
      throw new ForbiddenError('Only admins and vendors can assign drivers')
    }

    const body = await request.json()
    const validatedData = assignDriverSchema.parse(body)
    const { orderId, driverId } = validatedData

    // Verify order exists and belongs to vendor (if vendor)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        store: {
          select: {
            id: true,
            vendorId: true,
          },
        },
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // If vendor, verify order belongs to their store
    if (session.user.role === 'VENDOR' && order.store.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only assign drivers to your own orders')
    }

    // Check if order is in a valid state for assignment
    if (order.status !== 'READY' && order.status !== 'ASSIGNED') {
      return errorResponse(new Error('Order must be READY or ASSIGNED to assign a driver'), 400)
    }

    // If order is already assigned to a driver, check if we're reassigning
    if (order.driverId && order.driverId !== driverId) {
      // Reassignment - verify new driver exists
      if (driverId) {
        const newDriver = await prisma.driver.findUnique({
          where: { userId: driverId },
          select: { id: true, userId: true },
        })
        if (!newDriver) {
          return errorResponse(new Error('Driver not found'), 404)
        }
      }
    }

    let selectedDriverId = driverId

    // If no driver specified, find the nearest available driver
    if (!selectedDriverId) {
      // Get active drivers nearby (within 5km) - simplified for now
      // In production, use geospatial queries to find nearest drivers
      const driverLocations = await prisma.driverLocation.findMany({
        where: {
          isActive: true,
          status: 'online',
          updatedAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Active within last 15 minutes
          },
          // Exclude drivers with too many active orders
          driver: {
            orders: {
              none: {
                status: { in: ['ASSIGNED', 'IN_DELIVERY'] },
              },
            },
          },
        },
        include: {
          driver: {
            select: {
              userId: true,
              name: true,
              phone: true,
            },
          },
        },
        take: 10, // Get top 10 available drivers
      })

      if (driverLocations.length === 0) {
        return errorResponse(new Error('No available drivers nearby'), 400)
      }

      // Select first available driver (in production, use distance calculation)
      selectedDriverId = driverLocations[0].driver.userId
    } else {
      // Verify specified driver exists and is active
      const driver = await prisma.driver.findUnique({
        where: { userId: selectedDriverId },
        include: {
          location: true,
        },
      })

      if (!driver) {
        return errorResponse(new Error('Driver not found'), 404)
      }

      if (!driver.location?.isActive) {
        return errorResponse(new Error('Driver is not active'), 400)
      }
    }

    // Update order with assigned driver
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: selectedDriverId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Emit event for real-time updates
    emitOrderAssigned(updatedOrder, selectedDriverId)

    // Create notification for driver
    await prisma.notification.create({
      data: {
        recipientId: selectedDriverId,
        recipientRole: 'DRIVER',
        type: 'ORDER_ASSIGNED',
        title: 'New Delivery Assignment',
        message: `You have been assigned to deliver order #${orderId}`,
        relatedOrderId: orderId,
      },
    })

    // Create notification for customer
    await prisma.notification.create({
      data: {
        recipientId: order.customerId,
        recipientRole: 'CUSTOMER',
        type: 'DELIVERY_UPDATE',
        title: 'Driver Assigned',
        message: 'A driver has been assigned to your order and is on the way!',
        relatedOrderId: orderId,
      },
    })

    return successResponse({
      order: updatedOrder,
      driverId: selectedDriverId,
      message: 'Driver assigned successfully',
    })
  } catch (error) {
    console.error('[API] Error assigning driver:', error)
    return errorResponse(error)
  }
}
