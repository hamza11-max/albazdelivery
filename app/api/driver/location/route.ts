import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitDriverLocationUpdated } from '@/lib/events'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can update location')
    }

    const body = await request.json()
    const { latitude, longitude, accuracy, heading, speed, isActive, status, currentOrderId } = body
    const driverId = session.user.id

    // Update driver location
    const location = await prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        isActive: isActive !== undefined ? isActive : true,
        status: status || "online",
        currentOrderId,
        updatedAt: new Date(),
      },
      create: {
        driverId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        isActive: isActive !== undefined ? isActive : true,
        status: status || "online",
        currentOrderId,
      },
    })

    // Store location history
    await prisma.locationHistory.create({
      data: {
        driverLocationId: location.id,
        latitude,
        longitude,
        orderId: currentOrderId,
      }
    })

    // Emit event for real-time updates
    emitDriverLocationUpdated(driverId, { 
      lat: latitude, 
      lng: longitude,
      heading,
      speed,
      status,
      orderId: currentOrderId,
      timestamp: new Date()
    })

    return successResponse({ location })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const searchParams = request.nextUrl.searchParams
    const driverId = searchParams.get('driverId')
    const orderId = searchParams.get('orderId')

    if (!driverId && !orderId) {
      return errorResponse(new Error('driverId or orderId is required'), 400)
    }

    let location;
    
    if (orderId) {
      // Get driver location by order ID
      location = await prisma.driverLocation.findFirst({
        where: { currentOrderId: orderId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleType: true,
              photoUrl: true
            }
          }
        }
      })
    } else {
      // Get driver location by driver ID
      location = await prisma.driverLocation.findUnique({
        where: { driverId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleType: true,
              photoUrl: true
            }
          }
        }
      })
    }

    if (!location) {
      return errorResponse(new Error('Location not found'), 404)
    }

    return successResponse({ location })
  } catch (error) {
    return errorResponse(error)
  }
}
