import { prisma } from '@/root/lib/prisma'
import {
  DOMAIN_ENTITLEMENTS_BY_PLAN,
  type DomainEntitlements,
  isDomainWriteStatusAllowed,
  toSupportedPlan,
} from './domain-entitlements-config'

export async function getVendorDomainEntitlements(vendorId: string): Promise<DomainEntitlements> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: vendorId },
    select: { plan: true, status: true },
  })

  const currentPlan = toSupportedPlan(subscription?.plan)
  const currentStatus = String(subscription?.status || 'TRIAL').toUpperCase()
  const allowDomainWrites = isDomainWriteStatusAllowed(currentStatus)
  const planEntitlements = DOMAIN_ENTITLEMENTS_BY_PLAN[currentPlan]

  return {
    currentPlan,
    currentStatus,
    allowDomainWrites,
    allowVendorCustomDomain: allowDomainWrites && planEntitlements.allowVendorCustomDomain,
    maxStoreCustomDomains: allowDomainWrites ? planEntitlements.maxStoreCustomDomains : 0,
  }
}
export { calculateRemainingStoreDomains } from './domain-entitlements-config'
