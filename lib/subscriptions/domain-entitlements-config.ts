export type SupportedPlan = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE'
export type SupportedSubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED'

export interface DomainEntitlements {
  currentPlan: SupportedPlan
  currentStatus: SupportedSubscriptionStatus | string
  allowDomainWrites: boolean
  allowVendorCustomDomain: boolean
  maxStoreCustomDomains: number // -1 means unlimited
}

export const DOMAIN_ENTITLEMENTS_BY_PLAN: Record<
  SupportedPlan,
  { allowVendorCustomDomain: boolean; maxStoreCustomDomains: number }
> = {
  STARTER: { allowVendorCustomDomain: false, maxStoreCustomDomains: 0 },
  PROFESSIONAL: { allowVendorCustomDomain: true, maxStoreCustomDomains: 1 },
  BUSINESS: { allowVendorCustomDomain: true, maxStoreCustomDomains: 5 },
  ENTERPRISE: { allowVendorCustomDomain: true, maxStoreCustomDomains: -1 },
}

export function isDomainWriteStatusAllowed(status: string | null | undefined): boolean {
  const normalized = String(status || '').toUpperCase()
  return normalized === 'ACTIVE' || normalized === 'TRIAL'
}

export function toSupportedPlan(plan: string | null | undefined): SupportedPlan {
  const normalized = String(plan || '').toUpperCase()
  if (normalized === 'PROFESSIONAL' || normalized === 'BUSINESS' || normalized === 'ENTERPRISE') {
    return normalized
  }
  return 'STARTER'
}

export function calculateRemainingStoreDomains(
  maxStoreCustomDomains: number,
  usedStoreCustomDomains: number
): number {
  if (maxStoreCustomDomains < 0) return -1
  return Math.max(maxStoreCustomDomains - usedStoreCustomDomains, 0)
}

/**
 * When true, vendor subdomain + custom domain settings are writable regardless
 * of plan or subscription status (for `next dev` and optional local `next start`).
 *
 * Set `VENDOR_DOMAINS_DEV_UNLOCK=1` to enable the same behavior when
 * `NODE_ENV` is `production` (e.g. local production build).
 */
export function isVendorDomainsDevUnlock(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.VENDOR_DOMAINS_DEV_UNLOCK === '1'
  )
}
