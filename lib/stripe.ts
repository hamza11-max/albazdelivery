import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  }
  return stripeInstance
}

// Export for backward compatibility, but it will only be initialized when used
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

// Stripe Price IDs - Update these with your actual Stripe price IDs
export const PLAN_PRICES: Record<string, string> = {
  STARTER: '0', // Free
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
}

/** Vendor UI: Algeria-first amounts in DZD. Card charges follow Stripe price currency (often USD). */
export const PLAN_DISPLAY_PRICING: Record<string, { dzd: string; usdHint?: string }> = {
  STARTER: { dzd: '0' },
  PROFESSIONAL: { dzd: '5 900', usdHint: '≈ $39 USD / month if Stripe bills in USD' },
  BUSINESS: { dzd: '14 900', usdHint: '≈ $99 USD / month if Stripe bills in USD' },
  ENTERPRISE: { dzd: '36 900', usdHint: '≈ $249 USD / month if Stripe bills in USD' },
}

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
  support: 'email' | 'email_phone' | 'priority' | 'dedicated'
  rfid?: boolean
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  STARTER: {
    maxProducts: 50,
    maxUsers: 1,
    maxLocations: 1,
    cloudSync: false,
    apiAccess: false,
    whatsappFlows: true,
    salesHistoryMonths: 1,
    support: 'email',
  },
  PROFESSIONAL: {
    maxProducts: -1, // unlimited
    maxUsers: 3,
    maxLocations: 1,
    cloudSync: true,
    apiAccess: false,
    whatsappFlows: true,
    salesHistoryMonths: 12,
    support: 'email_phone',
  },
  BUSINESS: {
    maxProducts: -1,
    maxUsers: -1, // unlimited
    maxLocations: -1, // unlimited
    cloudSync: true,
    apiAccess: true,
    whatsappFlows: true,
    salesHistoryMonths: -1, // unlimited / all-time
    support: 'priority',
  },
  ENTERPRISE: {
    maxProducts: -1,
    maxUsers: -1,
    maxLocations: -1,
    cloudSync: true,
    apiAccess: true,
    whatsappFlows: true,
    salesHistoryMonths: -1,
    support: 'dedicated',
    rfid: true,
  },
}

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
