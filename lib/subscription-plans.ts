/**
 * Client-safe subscription plan metadata (no Stripe Node SDK).
 * Imported by hooks and vendor UI; keep free of `stripe` package imports.
 *
 * Aligns with ALBAZ_VENDOR_PLUS_PLAN.md tiers (Starter → Enterprise / Vendor+).
 */

export interface PlanFeatures {
  maxProducts: number
  maxUsers: number
  maxLocations: number
  cloudSync: boolean
  apiAccess: boolean
  /** WhatsApp Flows storefront ordering, linked store / webhook intake */
  whatsappFlows: boolean
  /** Longer sales / order history in vendor ERP views */
  salesHistoryMonths: number
  support: "email" | "email_phone" | "priority" | "dedicated"
  rfid?: boolean
  /** Branded `{slug}.{platform}` vendor host — Professional and above */
  brandedSubdomain: boolean
  /** Bring-your-own domain for vendor portal — Business and above */
  vendorBringYourOwnDomain: boolean
  /** Connected storefront custom domains (-1 unlimited) */
  maxStoreCustomDomains: number
  /** Invite drivers and assign deliveries (vendor dashboard) — Professional+ */
  driverFleetManagement: boolean
}

/** Vendor UI: Algeria-first amounts in DZD. Card charges follow Stripe price currency (often USD). */
export const PLAN_DISPLAY_PRICING: Record<string, { dzd: string; usdHint?: string }> = {
  STARTER: { dzd: "0" },
  PROFESSIONAL: {
    dzd: "4 400",
    usdHint: "≈ $29 USD / month if Stripe bills in USD (Professional)",
  },
  BUSINESS: {
    dzd: "11 900",
    usdHint: "≈ $79 USD / month if Stripe bills in USD (Business)",
  },
  ENTERPRISE: {
    dzd: "29 500",
    usdHint: "≈ $199 USD / month if Stripe bills in USD (Enterprise / Vendor+)",
  },
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  STARTER: {
    maxProducts: 5,
    maxUsers: 1,
    maxLocations: 1,
    cloudSync: false,
    apiAccess: false,
    whatsappFlows: false,
    salesHistoryMonths: 1,
    support: "email",
    brandedSubdomain: false,
    vendorBringYourOwnDomain: false,
    maxStoreCustomDomains: 0,
    driverFleetManagement: false,
  },
  PROFESSIONAL: {
    maxProducts: 50,
    maxUsers: 3,
    maxLocations: 1,
    cloudSync: true,
    apiAccess: false,
    whatsappFlows: true,
    salesHistoryMonths: 12,
    support: "email_phone",
    brandedSubdomain: true,
    vendorBringYourOwnDomain: false,
    maxStoreCustomDomains: 1,
    driverFleetManagement: true,
  },
  BUSINESS: {
    maxProducts: -1,
    maxUsers: -1,
    maxLocations: 5,
    cloudSync: true,
    apiAccess: true,
    whatsappFlows: true,
    salesHistoryMonths: -1,
    support: "priority",
    brandedSubdomain: true,
    vendorBringYourOwnDomain: true,
    maxStoreCustomDomains: 5,
  },
  ENTERPRISE: {
    maxProducts: -1,
    maxUsers: -1,
    maxLocations: -1,
    cloudSync: true,
    apiAccess: true,
    whatsappFlows: true,
    salesHistoryMonths: -1,
    support: "dedicated",
    rfid: true,
    brandedSubdomain: true,
    vendorBringYourOwnDomain: true,
    maxStoreCustomDomains: -1,
    driverFleetManagement: true,
  },
}

/** Default COD / Stripe-free Professional trial length in days (`VENDOR_TRIAL_DAYS` env overrides server-side). */
export const VENDOR_FREE_TRIAL_DAYS = 14

export function getPlanFeatures(plan: string): PlanFeatures {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.STARTER
}

/** Mirrors client `useSubscription`: Starter always; paid plans only while ACTIVE or TRIAL. */
export function subscriptionStatusGrantsPlanFeatures(plan: string, status: string): boolean {
  if (plan === "STARTER") return true
  return status === "ACTIVE" || status === "TRIAL"
}

export function hasFeature(plan: string, feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(plan)
  const value = features[feature] as boolean | number | string | undefined
  if (value === true || value === -1) return true
  return false
}

export function getFeatureLimit(plan: string, feature: keyof PlanFeatures): number {
  const features = getPlanFeatures(plan)
  return features[feature] as number || 0
}
