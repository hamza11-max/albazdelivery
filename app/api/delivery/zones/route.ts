import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for delivery zones
const createDeliveryZoneSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  city: z.string().min(2, 'City is required').max(100),
  coordinates: z.array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
  ).min(3, 'At least 3 coordinates are required to define a zone'),
  deliveryFee: z.number().nonnegative('Delivery fee cannot be negative'),
  estimatedTime: z.number().int().positive('Estimated time must be positive'),
})

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const isActive = searchParams.get('isActive')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const where: any = {}
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Get total count and zones with pagination
    const [total, zones] = await Promise.all([
      prisma.deliveryZone.count({ where }),
      prisma.deliveryZone.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({ 
      zones,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Zones fetch error:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // Only admins can create delivery zones
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can create delivery zones')
    }

    const body = await request.json()
    const validatedData = createDeliveryZoneSchema.parse(body)
    const { name, city, coordinates, deliveryFee, estimatedTime } = validatedData

    // Create delivery zone
    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        city,
        coordinates: coordinates as any, // Prisma Json type
        deliveryFee,
        estimatedTime,
        isActive: true,
      },
    })

    return successResponse({ zone }, 201)
  } catch (error) {
    console.error('[API] Zone creation error:', error)
    return errorResponse(error)
  }
}
