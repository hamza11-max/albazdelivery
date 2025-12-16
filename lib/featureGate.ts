import { prisma } from "@/lib/prisma"
import { PLAN_FEATURES, type PlanFeatures } from "./stripe"

export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription || subscription.status !== "ACTIVE") {
    return false
  }

  const planFeatures = PLAN_FEATURES[subscription.plan]
  if (!planFeatures) return false

  const value = planFeatures[feature]
  return value === true || value === -1
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

  if (!subscription || subscription.status !== "ACTIVE") {
    return false
  }

  const limit = PLAN_FEATURES[subscription.plan]?.[feature as keyof PlanFeatures]
  if (limit === -1) return true // unlimited

  // Check usage from database
  const usage = subscription.usage.find((u) => u.feature === feature)
  const actualUsage = usage?.currentUsage || currentUsage

  return actualUsage < (limit as number)
}

export async function getFeatureLimit(
  userId: string,
  feature: keyof PlanFeatures
): Promise<number> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription || subscription.status !== "ACTIVE") {
    return 0
  }

  const limit = PLAN_FEATURES[subscription.plan]?.[feature]
  return (limit as number) || 0
}

