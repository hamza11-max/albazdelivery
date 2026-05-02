import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { canMutateOpsAsFullAdmin } from '@/root/lib/admin-roles'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

/** GET — cross-store product list for admin (optional `storeId`, `search`, `available`, pagination). */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || !canMutateOpsAsFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only full admins can list products')
    }

    const sp = request.nextUrl.searchParams
    const storeIdParam = sp.get('storeId')
    const search = sp.get('search')?.trim()
    const availableRaw = sp.get('available')
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const limit = Math.min(Math.max(1, parseInt(sp.get('limit') || '50')), 100)

    const where: Prisma.ProductWhereInput = {}

    if (storeIdParam) {
      try {
        z.string().cuid().parse(storeIdParam)
      } catch {
        return errorResponse(new Error('Invalid storeId'), 400)
      }
      where.storeId = storeIdParam
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (availableRaw === 'true' || availableRaw === 'false') {
      where.available = availableRaw === 'true'
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
        },
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
