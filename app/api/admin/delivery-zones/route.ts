import { isFullAdmin } from '@/root/lib/admin-roles'
/** Mirrored admin delivery zones (`apps/admin`). */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../admin/lib/csrf'
import { z } from 'zod'

const zoneBodySchema = z.object({
  name: z.string().min(2).max(150),
  city: z.string().min(1).max(100),
  coordinates: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    )
    .min(3),
  deliveryFee: z.number().nonnegative(),
  estimatedTime: z.number().int().positive(),
  activeDrivers: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || !isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can list zones')
    }
    const city = request.nextUrl.searchParams.get('city')
    const zones = await prisma.deliveryZone.findMany({
      where: city ? { city: { contains: city, mode: 'insensitive' } } : undefined,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    })
    return successResponse({ zones })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can create zones')
    }
    const data = zoneBodySchema.parse(await request.json())
    const zone = await prisma.deliveryZone.create({
      data: {
        name: data.name,
        city: data.city,
        coordinates: data.coordinates,
        deliveryFee: data.deliveryFee,
        estimatedTime: data.estimatedTime,
        activeDrivers: data.activeDrivers ?? 0,
        isActive: data.isActive ?? true,
      },
    })
    return successResponse({ zone }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
