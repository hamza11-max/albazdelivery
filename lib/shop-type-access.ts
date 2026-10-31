import { prisma } from "@/lib/prisma"
import { ForbiddenError, UnauthorizedError } from "@/lib/errors"
import { resolveVendorOwnerContextId } from "@/lib/vendor-staff-access"
import {
  SHOP_TYPES,
  type ShopType,
} from "../apps/vendor/config/shopTypes"
import {
  getVendorFeatureFlags,
  type VendorFeatureKey,
} from "../apps/vendor/config/vendorFeatures"

type SessionLike = {
  user?: { id?: string; role?: string } | null
} | null

export function normalizeShopType(raw: string | null | undefined): ShopType {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
  if ((SHOP_TYPES as readonly string[]).includes(value)) {
    return value as ShopType
  }
  return "other"
}

export async function resolveOwnerShopType(actorUserId: string): Promise<ShopType> {
  const ownerId = await resolveVendorOwnerContextId(actorUserId)
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { shopType: true },
  })
  return normalizeShopType(user?.shopType)
}

/**
 * Ensures the authenticated vendor (or their owner context) has a shop-type feature flag.
 * ADMIN bypasses vertical gates so support tools remain usable.
 */
export async function assertVendorFeature(
  session: SessionLike,
  feature: VendorFeatureKey
): Promise<void> {
  if (!session?.user?.id) throw new UnauthorizedError()
  const role = String(session.user.role || "")
  if (role !== "VENDOR" && role !== "ADMIN") {
    throw new ForbiddenError("Vendor only")
  }
  if (role === "ADMIN") return

  const shopType = await resolveOwnerShopType(session.user.id)
  const flags = getVendorFeatureFlags(shopType)
  if (!flags[feature]) {
    throw new ForbiddenError(
      `This feature is not available for your shop type (${shopType}).`
    )
  }
}
