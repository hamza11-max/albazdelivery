import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
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
  STARTER: "0", // Free
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || "price_professional_monthly",
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS || "price_business_monthly",
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise_monthly",
}
