import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const searchParams = request.nextUrl.searchParams
    const lat = Number.parseFloat(searchParams.get('lat') || '0')
    const lng = Number.parseFloat(searchParams.get('lng') || '0')
    const radius = Number.parseFloat(searchParams.get('radius') || '5')

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
      .map((loc) => {
        const distance = calculateDistance(lat, lng, loc.latitude, loc.longitude)
        return {
          ...loc,
          // cast driver access to any to satisfy typings if Prisma generation differs
          driver: (loc as any).driver,
          distance,
        }
      })
      .filter((d) => d.distance <= radius)
      .sort((a, b) => a.distance - b.distance)

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
