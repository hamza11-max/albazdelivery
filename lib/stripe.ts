import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
})

// Stripe Price IDs - Update these with your actual Stripe price IDs
export const PLAN_PRICES: Record<string, string> = {
  STARTER: '0', // Free
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
}

export interface PlanFeatures {
  maxProducts: number
  maxUsers: number
  maxLocations: number
  cloudSync: boolean
  apiAccess: boolean
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
    support: 'email',
  },
  PROFESSIONAL: {
    maxProducts: -1, // unlimited
    maxUsers: 3,
    maxLocations: 1,
    cloudSync: true,
    apiAccess: false,
    support: 'email_phone',
  },
  BUSINESS: {
    maxProducts: -1,
    maxUsers: -1, // unlimited
    maxLocations: -1, // unlimited
    cloudSync: true,
    apiAccess: true,
    support: 'priority',
  },
  ENTERPRISE: {
    maxProducts: -1,
    maxUsers: -1,
    maxLocations: -1,
    cloudSync: true,
    apiAccess: true,
    support: 'dedicated',
    rfid: true,
  },
}

export function getPlanFeatures(plan: string): PlanFeatures {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.STARTER
}

export function hasFeature(plan: string, feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(plan)
  return features[feature] === true || features[feature] === -1
}

export function getFeatureLimit(plan: string, feature: keyof PlanFeatures): number {
  const features = getPlanFeatures(plan)
  return features[feature] as number || 0
}
