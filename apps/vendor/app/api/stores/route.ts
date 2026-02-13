import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

// GET /api/stores - Get stores with optional filters; returns empty when DB unavailable (e.g. packaged app)
export async function GET(request: NextRequest) {
  try {
    try {
      applyRateLimit(request, rateLimitConfigs.api)
    } catch (rateLimitError) {
      console.warn('[Stores API] Rate limit check failed:', rateLimitError)
    }

    const session = await auth().catch(() => null)
    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const vendorIdParam = searchParams.get('vendorId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const where: Record<string, unknown> = {}
    if (!vendorIdParam || !includeInactive) {
      where.isActive = true
    }
    if (vendorIdParam) {
      where.vendorId = vendorIdParam
      if (!session?.user) {
        throw new UnauthorizedError()
      }
      const isAdmin = session.user.role === 'ADMIN'
      const isVendor = session.user.role === 'VENDOR'
      const isSelf = session.user.id === vendorIdParam
      if (!isAdmin && !(isVendor && isSelf)) {
        throw new UnauthorizedError()
      }
    }

    let total = 0
    let stores: unknown[] = []

    try {
      total = await prisma.store.count({ where: where as any })
      stores = await prisma.store.findMany({
        where: where as any,
        include: {
          vendor: { select: { id: true, name: true } },
        },
        orderBy: { rating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    } catch (dbError) {
      console.warn('[Stores API] Database unavailable, returning empty list:', dbError)
      return successResponse({
        stores: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
      })
    }

    return successResponse({
      stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Stores API] Error:', error)
    return errorResponse(error)
  }
}
