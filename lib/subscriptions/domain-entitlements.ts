import { prisma } from '@/root/lib/prisma'
import { PLAN_FEATURES } from '@/root/lib/subscription-plans'
import {
  type DomainEntitlements,
  isDomainWriteStatusAllowed,
  isVendorDomainsDevUnlock,
  toSupportedPlan,
} from './domain-entitlements-config'
import { resolveVendorEntitlements } from './resolve-entitlements'

export async function getVendorDomainEntitlements(vendorId: string): Promise<DomainEntitlements> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: vendorId },
    select: { plan: true, status: true, featureOverrides: true },
  })

  const currentPlan = toSupportedPlan(subscription?.plan)
  const currentStatus = String(subscription?.status || 'TRIAL').toUpperCase()
  const allowDomainWrites = isDomainWriteStatusAllowed(currentStatus)

  const effective = subscription
    ? resolveVendorEntitlements({
        plan: subscription.plan,
        status: subscription.status,
        featureOverrides: subscription.featureOverrides,
      })
    : PLAN_FEATURES.STARTER

  const base: DomainEntitlements = {
    currentPlan,
    currentStatus,
    allowDomainWrites,
    allowVendorBrandedSubdomain: allowDomainWrites && effective.brandedSubdomain,
    allowVendorCustomDomain: allowDomainWrites && effective.vendorBringYourOwnDomain,
    maxStoreCustomDomains: allowDomainWrites ? effective.maxStoreCustomDomains : 0,
  }

  if (isVendorDomainsDevUnlock()) {
    return {
      ...base,
      allowDomainWrites: true,
      allowVendorBrandedSubdomain: true,
      allowVendorCustomDomain: true,
      maxStoreCustomDomains: -1,
    }
  }

  return base
}
export { calculateRemainingStoreDomains } from './domain-entitlements-config'
