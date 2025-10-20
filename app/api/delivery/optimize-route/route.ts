import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const { driverId, orderIds } = await request.json()

    if (!driverId || !orderIds || orderIds.length === 0) {
      return errorResponse(new Error('driverId and orderIds are required'), 400)
    }

    // Simple route optimization stub
    const estimatedTime = orderIds.length * 7 // 7 min per delivery
    const totalDistance = orderIds.length * 2.5 // 2.5km per delivery

    return successResponse({
      route: {
        driverId,
        orderIds,
        optimizedSequence: orderIds,
        totalDistance,
        estimatedTime,
        message: 'Route optimized (basic algorithm)',
      },
    })
  } catch (error) {
    console.error('[API] Route optimization error:', error)
    return errorResponse(error)
  }
}
