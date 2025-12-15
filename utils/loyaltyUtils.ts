"use client"

export interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  discountPercent: number
  color: string
}

export interface LoyaltyRule {
  id: string
  name: string
  pointsPerDZD: number
  isActive: boolean
}

export interface CustomerLoyalty {
  customerId: string
  customerName: string
  customerPhone: string
  totalPoints: number
  currentTier: string
  lifetimeSpent: number
  pointsEarned: number
  pointsRedeemed: number
  lastPurchaseDate: string | null
  createdAt: string
}

export const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    discountPercent: 0,
    color: "#cd7f32",
  },
  {
    id: "silver",
    name: "Argent",
    minPoints: 500,
    discountPercent: 5,
    color: "#c0c0c0",
  },
  {
    id: "gold",
    name: "Or",
    minPoints: 1000,
    discountPercent: 10,
    color: "#ffd700",
  },
  {
    id: "platinum",
    name: "Platine",
    minPoints: 2500,
    discountPercent: 15,
    color: "#e5e4e2",
  },
]

export const DEFAULT_RULE: LoyaltyRule = {
  id: "default",
  name: "Règle par défaut",
  pointsPerDZD: 1, // 1 point per 1 DZD spent
  isActive: true,
}

export function calculatePointsEarned(amount: number, rule: LoyaltyRule): number {
  if (!rule.isActive) return 0
  return Math.floor(amount * rule.pointsPerDZD)
}

export function getTierForPoints(points: number, tiers: LoyaltyTier[]): LoyaltyTier {
  const sortedTiers = [...tiers].sort((a, b) => b.minPoints - a.minPoints)
  for (const tier of sortedTiers) {
    if (points >= tier.minPoints) {
      return tier
    }
  }
  return sortedTiers[sortedTiers.length - 1] || DEFAULT_TIERS[0]
}

export function getLoyaltyDiscount(points: number, tiers: LoyaltyTier[]): number {
  const tier = getTierForPoints(points, tiers)
  return tier.discountPercent
}

export function canRedeemPoints(points: number, requiredPoints: number): boolean {
  return points >= requiredPoints
}

export function getLoyaltyCustomer(customerId: string): CustomerLoyalty | null {
  const customers = JSON.parse(localStorage.getItem('vendor-loyalty-customers') || '[]')
  return customers.find((c: CustomerLoyalty) => c.customerId === customerId) || null
}

export function getAllLoyaltyCustomers(): CustomerLoyalty[] {
  return JSON.parse(localStorage.getItem('vendor-loyalty-customers') || '[]')
}

export function addLoyaltyPoints(
  customerId: string,
  customerName: string,
  customerPhone: string,
  points: number,
  amountSpent: number
): CustomerLoyalty {
  const customers = getAllLoyaltyCustomers()
  let customer = customers.find((c) => c.customerId === customerId)

  if (customer) {
    customer.totalPoints += points
    customer.pointsEarned += points
    customer.lifetimeSpent += amountSpent
    customer.lastPurchaseDate = new Date().toISOString()
    customer.currentTier = getTierForPoints(customer.totalPoints, DEFAULT_TIERS).id
  } else {
    customer = {
      customerId,
      customerName,
      customerPhone,
      totalPoints: points,
      currentTier: getTierForPoints(points, DEFAULT_TIERS).id,
      lifetimeSpent: amountSpent,
      pointsEarned: points,
      pointsRedeemed: 0,
      lastPurchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    customers.push(customer)
  }

  localStorage.setItem('vendor-loyalty-customers', JSON.stringify(customers))
  return customer
}

export function redeemLoyaltyPoints(customerId: string, pointsToRedeem: number): { success: boolean; message: string } {
  const customers = getAllLoyaltyCustomers()
  const customer = customers.find((c) => c.customerId === customerId)

  if (!customer) {
    return { success: false, message: 'Customer not found' }
  }

  if (customer.totalPoints < pointsToRedeem) {
    return { success: false, message: 'Insufficient points' }
  }

  customer.totalPoints -= pointsToRedeem
  customer.pointsRedeemed += pointsToRedeem
  customer.currentTier = getTierForPoints(customer.totalPoints, DEFAULT_TIERS).id

  localStorage.setItem('vendor-loyalty-customers', JSON.stringify(customers))
  return { success: true, message: 'Points redeemed successfully' }
}

export function getLoyaltyTiers(): LoyaltyTier[] {
  const stored = localStorage.getItem('vendor-loyalty-tiers')
  return stored ? JSON.parse(stored) : DEFAULT_TIERS
}

export function saveLoyaltyTiers(tiers: LoyaltyTier[]): void {
  localStorage.setItem('vendor-loyalty-tiers', JSON.stringify(tiers))
}

export function getLoyaltyRules(): LoyaltyRule[] {
  const stored = localStorage.getItem('vendor-loyalty-rules')
  return stored ? JSON.parse(stored) : [DEFAULT_RULE]
}

export function saveLoyaltyRules(rules: LoyaltyRule[]): void {
  localStorage.setItem('vendor-loyalty-rules', JSON.stringify(rules))
}

