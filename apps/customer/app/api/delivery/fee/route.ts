import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'

const DEFAULT_FEE = 500

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const city = request.nextUrl.searchParams.get('city')?.trim()

    if (!city) {
      return successResponse({ fee: DEFAULT_FEE, city: null })
    }

    const zone = await prisma.deliveryZone.findFirst({
      where: {
        city: { contains: city, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { deliveryFee: 'asc' },
    })

    return successResponse({
      fee: zone?.deliveryFee ?? DEFAULT_FEE,
      city: zone?.city ?? city,
      estimatedTime: zone?.estimatedTime ?? null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
