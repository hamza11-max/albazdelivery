import type { OrderSource } from '@/generated/prisma/client'

/**
 * When PromoCode.allowedSources is null/undefined, promo applies on all channels.
 * Otherwise JSON array must list sources, e.g. ["WHATSAPP"].
 */
export function promoAllowedForOrderSource(allowedSources: unknown, source: OrderSource): boolean {
  if (allowedSources == null) {
    return true
  }
  if (!Array.isArray(allowedSources)) {
    return true
  }
  return allowedSources.includes(source)
}
