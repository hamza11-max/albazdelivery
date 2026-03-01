import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const body = await request.json()
    const code = String(body?.code ?? '').trim().toUpperCase()
    const subtotal = Number(body?.subtotal ?? 0)

    if (!code || subtotal < 0) {
      return successResponse({ valid: false, discount: 0, error: 'Invalid input' })
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code, isActive: true },
    })

    if (!promo) {
      return successResponse({ valid: false, discount: 0, error: 'Code promo invalide' })
    }

    const now = new Date()
    if (now < promo.startsAt || now > promo.expiresAt) {
      return successResponse({ valid: false, discount: 0, error: 'Code promo expiré' })
    }

    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
      return successResponse({ valid: false, discount: 0, error: 'Code promo épuisé' })
    }

    if (promo.minOrderAmount != null && subtotal < promo.minOrderAmount) {
      return successResponse({
        valid: false,
        discount: 0,
        error: `Commande minimum ${promo.minOrderAmount} DZD requise`,
      })
    }

    let discount = 0
    if (promo.discountType === 'percent') {
      discount = Math.round(subtotal * (promo.discountValue / 100))
      if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount)
    } else {
      discount = Math.min(promo.discountValue, subtotal)
    }

    return successResponse({
      valid: true,
      discount,
      code: promo.code,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
