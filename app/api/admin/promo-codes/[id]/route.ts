/** Mirrored admin promo codes `[id]` (`apps/admin`). */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { z } from 'zod'

const patchPromo = z.object({
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minOrderAmount: z.number().nonnegative().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') throw new ForbiddenError('Only admins')
    const { id } = await context.params
    const parsed = patchPromo.safeParse(await request.json())
    if (!parsed.success) return errorResponse(new Error(parsed.error.message), 400)
    const existing = await prisma.promoCode.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Promo code')
    const d = parsed.data
    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(d.discountType != null ? { discountType: d.discountType } : {}),
        ...(d.discountValue != null ? { discountValue: d.discountValue } : {}),
        ...(d.maxDiscount !== undefined ? { maxDiscount: d.maxDiscount } : {}),
        ...(d.minOrderAmount !== undefined ? { minOrderAmount: d.minOrderAmount } : {}),
        ...(d.usageLimit !== undefined ? { usageLimit: d.usageLimit } : {}),
        ...(d.startsAt != null ? { startsAt: new Date(d.startsAt) } : {}),
        ...(d.expiresAt != null ? { expiresAt: new Date(d.expiresAt) } : {}),
        ...(d.isActive != null ? { isActive: d.isActive } : {}),
      },
    })
    return successResponse({ promoCode })
  } catch (error) {
    return errorResponse(error)
  }
}
