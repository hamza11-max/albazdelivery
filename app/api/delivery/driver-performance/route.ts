import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { searchParams } = request.nextUrl
    const driverId = searchParams.get('driverId')

    if (driverId) {
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

      return successResponse({ performance })
    }

    // Get top performing drivers
    const topDrivers = await prisma.driverPerformance.findMany({
      orderBy: {
        rating: 'desc',
      },
      take: 10,
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

    return successResponse({ drivers: topDrivers })
  } catch (error) {
    console.error('[API] Performance fetch error:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { driverId, totalDeliveries, averageDeliveryTime, onTimePercentage, rating, earnings } = await request.json()

    if (!driverId) {
      return errorResponse(new Error('driverId is required'), 400)
    }

    // Upsert performance record
    const performance = await prisma.driverPerformance.upsert({
      where: { driverId },
      update: {
        totalDeliveries,
        averageDeliveryTime,
        onTimePercentage,
        rating,
        earnings,
      },
      create: {
        driverId,
        totalDeliveries: totalDeliveries || 0,
        averageDeliveryTime: averageDeliveryTime || 0,
        onTimePercentage: onTimePercentage || 100,
        rating: rating || 5,
        earnings: earnings || 0,
      },
    })

    return successResponse({ performance })
  } catch (error) {
    console.error('[API] Performance creation error:', error)
    return errorResponse(error)
  }
}
