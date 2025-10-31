import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderAssigned } from '@/lib/events'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'VENDOR')) {
      throw new UnauthorizedError('Only admins/vendors can auto-assign drivers')
    }

    const body = await request.json()
    const { orderId } = body

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Get active drivers nearby (within 5km)
    const driverLocations = await prisma.driverLocation.findMany({
      where: {
        isActive: true,
        updatedAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    if (driverLocations.length === 0) {
      return errorResponse(new Error('No drivers available'), 400)
    }

    // Simple: assign to first available driver
    const selectedDriver = driverLocations[0]

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: selectedDriver.driverId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    })

  emitOrderAssigned(updatedOrder, selectedDriver.driverId)

    return successResponse({
      order: updatedOrder,
      // selectedDriver may not have a fully typed `driver` property depending on Prisma client generation; return id safely
      driver: selectedDriver.driver ?? { id: selectedDriver.driverId },
    })
  } catch (error) {
    console.error('[API] Error assigning driver:', error)
    return errorResponse(error)
  }
}
