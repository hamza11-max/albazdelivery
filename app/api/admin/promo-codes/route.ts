import { isFullAdmin } from '@/root/lib/admin-roles'
/** Mirrored admin promo codes (`apps/admin`). */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../admin/lib/csrf'
import { z } from 'zod'

const promoPost = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Z0-9\-]+$/i),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minOrderAmount: z.number().nonnegative().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  isActive: z.boolean().optional(),
  allowedSources: z.unknown().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || !isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can list promo codes')
    }
    const activeOnly = request.nextUrl.searchParams.get('active')
    const promos = await prisma.promoCode.findMany({
      where:
        activeOnly === 'true' ? { isActive: true } : activeOnly === 'false' ? { isActive: false } : undefined,
      orderBy: [{ createdAt: 'desc' }],
    })
    return successResponse({ promoCodes: promos })
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
    if (!isFullAdmin(session.user.role)) throw new ForbiddenError('Only admins')
    const data = promoPost.parse(await request.json())
    const codeUpper = data.code.trim().toUpperCase()
    const dup = await prisma.promoCode.findUnique({ where: { code: codeUpper } })
    if (dup) return errorResponse(new Error('Code already exists'), 409)
    const promo = await prisma.promoCode.create({
      data: {
        code: codeUpper,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount ?? null,
        minOrderAmount: data.minOrderAmount ?? null,
        usageLimit: data.usageLimit ?? null,
        usedCount: 0,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: new Date(data.expiresAt),
        isActive: data.isActive ?? true,
        allowedSources:
          data.allowedSources === null || data.allowedSources === undefined
            ? undefined
            : (data.allowedSources as object),
      },
    })
    return successResponse({ promoCode: promo }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
