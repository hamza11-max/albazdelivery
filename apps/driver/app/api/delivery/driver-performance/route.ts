import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const { searchParams } = request.nextUrl
    const driverId = searchParams.get('driverId')
    const limitParam = searchParams.get('limit')

    if (driverId) {
      // Validate driverId format
      try {
        z.string().cuid().parse(driverId)
      } catch {
        return errorResponse(new Error('Invalid driver ID format'), 400)
      }

      const performance = await prisma.driverPerformance.findUnique({
        where: { driverId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleType: true,
            },
          },
        },
      })

      if (!performance) {
        throw new NotFoundError('Driver performance')
      }

      return successResponse({ performance })
    }

    // Get top performing drivers
    const limit = Math.min(Math.max(1, parseInt(limitParam || '10')), 50)
    const topDrivers = await prisma.driverPerformance.findMany({
      orderBy: {
        rating: 'desc',
      },
      take: limit,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
          },
        },
      },
    })

    return successResponse({ drivers: topDrivers })
  } catch (error) {
    console.error('[API] Performance fetch error:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only admins can update driver performance
    if (session.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can update driver performance')
    }

    const body = await request.json()
    const { driverId, totalDeliveries, averageDeliveryTime, onTimePercentage, rating, earnings } = body

    if (!driverId) {
      return errorResponse(new Error('driverId is required'), 400)
    }

    // Validate driverId format
    try {
      z.string().cuid().parse(driverId)
    } catch {
      return errorResponse(new Error('Invalid driver ID format'), 400)
    }

    // Validate numeric fields
    if (totalDeliveries !== undefined && (!Number.isInteger(totalDeliveries) || totalDeliveries < 0)) {
      return errorResponse(new Error('totalDeliveries must be a non-negative integer'), 400)
    }
    if (averageDeliveryTime !== undefined && (typeof averageDeliveryTime !== 'number' || averageDeliveryTime < 0)) {
      return errorResponse(new Error('averageDeliveryTime must be a non-negative number'), 400)
    }
    if (onTimePercentage !== undefined && (typeof onTimePercentage !== 'number' || onTimePercentage < 0 || onTimePercentage > 100)) {
      return errorResponse(new Error('onTimePercentage must be between 0 and 100'), 400)
    }
    if (rating !== undefined && (typeof rating !== 'number' || rating < 0 || rating > 5)) {
      return errorResponse(new Error('rating must be between 0 and 5'), 400)
    }
    if (earnings !== undefined && (typeof earnings !== 'number' || earnings < 0)) {
      return errorResponse(new Error('earnings must be a non-negative number'), 400)
    }

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
      select: { id: true },
    })

    if (!driver) {
      return errorResponse(new Error('Driver not found'), 404)
    }

    // Upsert performance record
    const performance = await prisma.driverPerformance.upsert({
      where: { driverId },
      update: {
        ...(totalDeliveries !== undefined && { totalDeliveries }),
        ...(averageDeliveryTime !== undefined && { averageDeliveryTime }),
        ...(onTimePercentage !== undefined && { onTimePercentage }),
        ...(rating !== undefined && { rating }),
        ...(earnings !== undefined && { earnings }),
        updatedAt: new Date(),
      },
      create: {
        driverId,
        totalDeliveries: totalDeliveries || 0,
        averageDeliveryTime: averageDeliveryTime || 0,
        onTimePercentage: onTimePercentage ?? 100,
        rating: rating ?? 5,
        earnings: earnings || 0,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
          },
        },
      },
    })

    return successResponse({ performance })
  } catch (error) {
    console.error('[API] Performance creation error:', error)
    return errorResponse(error)
  }
}
