/** Mirrored from `apps/admin/app/api/admin/drivers/overview/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

/** Locations + persisted performance aggregates per driver. */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access driver overview')
    }

    const [locations, performances, deliveriesByDriver] = await Promise.all([
      prisma.driverLocation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.driverPerformance.findMany({
        include: {
          driver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.order.groupBy({
        by: ['driverId'],
        where: { driverId: { not: null }, status: 'DELIVERED' },
        _count: { id: true },
      }),
    ])

    const deliveredFallback = Object.fromEntries(
      deliveriesByDriver.filter((r) => r.driverId).map((r) => [r.driverId!, r._count.id])
    )

    return successResponse({
      locations,
      performances,
      deliveredCountByDriver: deliveredFallback,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
