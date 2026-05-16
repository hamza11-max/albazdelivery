import { prisma } from "@/lib/prisma"
import type { PlanFeatures } from "./subscription-plans"
import { resolveVendorEntitlements } from "./subscriptions/resolve-entitlements"
import { vendorDevDriverFleetUnlocked } from "./vendor-dev-flags"

export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  if (feature === "driverFleetManagement" && vendorDevDriverFleetUnlocked()) {
    return true
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      featureOverrides: true,
    },
  })

  if (!subscription) return false

  const entitlements = resolveVendorEntitlements(subscription)

  const value = entitlements[feature] as boolean | number | string | undefined
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === -1
  return false
}

export async function checkUsageLimit(
  userId: string,
  feature: string,
  currentUsage: number
): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { usage: true },
  })

  if (!subscription) return false

  const fk = feature as keyof PlanFeatures
  const entitlements = resolveVendorEntitlements({
    plan: subscription.plan,
    status: subscription.status,
    featureOverrides: subscription.featureOverrides,
  })

  const limit = entitlements[fk]
  if (limit === undefined || typeof limit !== "number") return false
  if (limit === -1) return true

  const usage = subscription.usage.find((u) => u.feature === feature)
  const actualUsage = usage?.currentUsage ?? currentUsage

  return actualUsage < limit
}

export async function getFeatureLimit(
  userId: string,
  feature: keyof PlanFeatures
): Promise<number> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, featureOverrides: true },
  })

  if (!subscription) return 0

  const entitlements = resolveVendorEntitlements(subscription)
  const limit = entitlements[feature]
  return typeof limit === "number" ? limit : 0
}

