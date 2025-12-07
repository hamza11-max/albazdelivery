import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const radiusParam = searchParams.get('radius')

    if (!latParam || !lngParam) {
      return errorResponse(new Error('lat and lng are required'), 400)
    }

    const lat = Number.parseFloat(latParam)
    const lng = Number.parseFloat(lngParam)
    const radius = Math.min(Math.max(1, Number.parseFloat(radiusParam || '5')), 50) // Limit radius to 1-50 km

    // Validate coordinates
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return errorResponse(new Error('Invalid latitude. Must be between -90 and 90'), 400)
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return errorResponse(new Error('Invalid longitude. Must be between -180 and 180'), 400)
    }
    if (isNaN(radius) || radius <= 0) {
      return errorResponse(new Error('Invalid radius. Must be a positive number'), 400)
    }

    // Get all active driver locations
    const driverLocations = await prisma.driverLocation.findMany({
      where: {
        isActive: true,
        updatedAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
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

    // Calculate distance and filter by radius
    const nearbyDrivers = driverLocations
      .map((loc: any) => {
        const distance = calculateDistance(lat, lng, loc.latitude, loc.longitude)
        return {
          ...loc,
          driver: loc.driver,
          distance,
        }
      })
      .filter((d: any) => d.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance)

    return successResponse({ drivers: nearbyDrivers })
  } catch (error) {
    console.error('[API] Error fetching nearby drivers:', error)
    return errorResponse(error)
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

