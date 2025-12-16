# Subscription System Implementation Guide

## 📋 Table of Contents
1. [Database Schema](#database-schema)
2. [Payment Integration](#payment-integration)
3. [API Routes](#api-routes)
4. [Frontend Components](#frontend-components)
5. [Feature Gating](#feature-gating)
6. [Migration Strategy](#migration-strategy)
7. [Testing](#testing)

---

## 🗄️ Database Schema

### Prisma Schema Updates

```prisma
// Add to prisma/schema.prisma

enum SubscriptionPlan {
  STARTER
  PROFESSIONAL
  BUSINESS
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
  TRIAL
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model Subscription {
  id                String              @id @default(cuid())
  userId            String              @unique
  plan              SubscriptionPlan    @default(STARTER)
  status            SubscriptionStatus @default(TRIAL)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean            @default(false)
  cancelledAt       DateTime?
  trialStart        DateTime?
  trialEnd          DateTime?
  stripeCustomerId  String?            @unique
  stripeSubscriptionId String?          @unique
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments          Payment[]
  usage             SubscriptionUsage[]
  
  @@index([userId])
  @@index([status])
  @@index([plan])
}

model Payment {
  id                String            @id @default(cuid())
  subscriptionId    String
  amount            Float
  currency          String            @default("USD")
  status            PaymentStatus      @default(PENDING)
  stripePaymentId   String?           @unique
  invoiceUrl        String?
  paidAt            DateTime?
  createdAt         DateTime          @default(now())
  
  subscription      Subscription      @relation(fields: [subscriptionId], references: [id])
  
  @@index([subscriptionId])
  @@index([status])
}

model SubscriptionUsage {
  id                String            @id @default(cuid())
  subscriptionId    String
  feature           String            // e.g., "products", "users", "locations"
  currentUsage      Int               @default(0)
  limit             Int
  periodStart       DateTime
  periodEnd         DateTime
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  subscription      Subscription      @relation(fields: [subscriptionId], references: [id])
  
  @@unique([subscriptionId, feature, periodStart])
  @@index([subscriptionId])
}

// Update User model
model User {
  // ... existing fields ...
  subscription      Subscription?
}
```

---

## 💳 Payment Integration (Stripe)

### 1. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### 2. Environment Variables

```env
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Stripe Configuration

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export const PLAN_PRICES: Record<string, string> = {
  STARTER: '0', // Free
  PROFESSIONAL: 'price_professional_monthly', // Stripe Price ID
  BUSINESS: 'price_business_monthly',
  ENTERPRISE: 'price_enterprise_monthly',
}

export const PLAN_FEATURES = {
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
    maxUsers: -1,
    maxLocations: -1,
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
```

---

## 🔌 API Routes

### 1. Subscription Management

```typescript
// app/api/subscriptions/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { stripe } from '@/lib/stripe'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'

// GET /api/subscriptions - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        usage: true,
      },
    })

    if (!subscription) {
      // Create default starter subscription
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: 'STARTER',
          status: 'TRIAL',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
      return successResponse(newSubscription)
    }

    return successResponse(subscription)
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/subscriptions - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { plan, paymentMethodId } = body

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    let stripeCustomerId = subscription?.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          userId: session.user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    // Handle free plan
    if (plan === 'STARTER') {
      const updated = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
          plan: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          stripeCustomerId,
        },
        create: {
          userId: session.user.id,
          plan: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          stripeCustomerId,
        },
      })
      return successResponse(updated)
    }

    // Create Stripe subscription for paid plans
    const priceId = PLAN_PRICES[plan]
    if (!priceId) {
      throw new Error('Invalid plan')
    }

    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    // Update database
    const updated = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        status: 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      create: {
        userId: session.user.id,
        plan,
        status: 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    })

    return successResponse({
      subscription: updated,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
```

### 2. Cancel Subscription

```typescript
// app/api/subscriptions/cancel/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { stripe } from '@/lib/stripe'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    const updated = await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    })

    return successResponse(updated)
  } catch (error) {
    return errorResponse(error)
  }
}
```

### 3. Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/root/lib/prisma'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle events
  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription },
      })
      
      if (subscription) {
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'COMPLETED',
            stripePaymentId: invoice.payment_intent,
            invoiceUrl: invoice.hosted_invoice_url,
            paidAt: new Date(),
          },
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription },
      })
      
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAST_DUE' },
        })
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
```

---

## 🎨 Frontend Components

### 1. Subscription Management Component

```typescript
// components/subscription/SubscriptionManager.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Crown, Zap, Building, Rocket } from "lucide-react"

interface Subscription {
  id: string
  plan: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

const PLANS = {
  STARTER: {
    name: "Starter",
    price: "$0",
    icon: Zap,
    features: [
      "Up to 50 products",
      "Basic POS",
      "Basic inventory",
      "30 days sales history",
      "Email support",
    ],
  },
  PROFESSIONAL: {
    name: "Professional",
    price: "$29",
    icon: Crown,
    features: [
      "Unlimited products",
      "Advanced inventory",
      "Full sales history",
      "Cloud sync",
      "Up to 3 users",
      "Advanced reporting",
      "Email & phone support",
    ],
  },
  BUSINESS: {
    name: "Business",
    price: "$79",
    icon: Building,
    features: [
      "Everything in Professional",
      "Multi-location",
      "Unlimited users",
      "API access",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise (Vendor +)",
    price: "$199",
    icon: Rocket,
    features: [
      "Everything in Business",
      "RFID Integration",
      "Real-time tracking",
      "Loss prevention",
      "Dedicated support",
      "Custom development",
      "SLA guarantees",
    ],
  },
}

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions")
      const data = await res.json()
      if (data.success) {
        setSubscription(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    if (plan === subscription?.plan) return

    setUpgrading(true)
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (data.success) {
        if (data.data.clientSecret) {
          // Handle payment with Stripe
          // Redirect to checkout or show payment modal
          toast({
            title: "Redirecting to payment",
            description: "Please complete your payment to upgrade",
          })
        } else {
          toast({
            title: "Subscription updated",
            description: `You are now on the ${PLANS[plan as keyof typeof PLANS].name} plan`,
          })
          fetchSubscription()
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      })
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: "Subscription cancelled",
          description: "Your subscription will remain active until the end of the billing period",
        })
        fetchSubscription()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const currentPlan = subscription?.plan || "STARTER"

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              {subscription.cancelAtPeriodEnd
                ? "Your subscription will cancel at the end of the billing period"
                : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                  {PLANS[currentPlan as keyof typeof PLANS].name}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Status: {subscription.status}
                </p>
              </div>
              {subscription.plan !== "STARTER" && !subscription.cancelAtPeriodEnd && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PLANS).map(([key, plan]) => {
          const Icon = plan.icon
          const isCurrent = currentPlan === key
          const isUpgrade = getPlanOrder(key) > getPlanOrder(currentPlan)

          return (
            <Card key={key} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="text-3xl font-bold">{plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || upgrading}
                  onClick={() => handleUpgrade(key)}
                >
                  {isCurrent ? "Current Plan" : isUpgrade ? "Upgrade" : "Downgrade"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function getPlanOrder(plan: string): number {
  const order: Record<string, number> = {
    STARTER: 0,
    PROFESSIONAL: 1,
    BUSINESS: 2,
    ENTERPRISE: 3,
  }
  return order[plan] || 0
}
```

### 2. Feature Gate Hook

```typescript
// hooks/useSubscription.ts
import { useState, useEffect } from "react"
import { PLAN_FEATURES } from "@/lib/stripe"

interface Subscription {
  plan: string
  status: string
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubscription(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const hasFeature = (feature: string): boolean => {
    if (!subscription || subscription.status !== "ACTIVE") {
      return false
    }

    const planFeatures = PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES]
    return planFeatures?.[feature as keyof typeof planFeatures] === true
  }

  const getLimit = (feature: string): number => {
    if (!subscription || subscription.status !== "ACTIVE") {
      return 0
    }

    const planFeatures = PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES]
    return planFeatures?.[feature as keyof typeof planFeatures] as number || 0
  }

  const checkLimit = (feature: string, currentUsage: number): boolean => {
    const limit = getLimit(feature)
    if (limit === -1) return true // unlimited
    return currentUsage < limit
  }

  return {
    subscription,
    loading,
    hasFeature,
    getLimit,
    checkLimit,
  }
}
```

---

## 🔒 Feature Gating

### 1. Middleware for Feature Checks

```typescript
// lib/featureGate.ts
import { PLAN_FEATURES } from "./stripe"

export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  // Fetch user's subscription from database
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription || subscription.status !== "ACTIVE") {
    return false
  }

  const planFeatures = PLAN_FEATURES[subscription.plan]
  return planFeatures?.[feature] === true
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

  const limit = PLAN_FEATURES[subscription.plan]?.[feature]
  if (limit === -1) return true // unlimited

  // Check usage from database
  const usage = subscription.usage.find((u) => u.feature === feature)
  const actualUsage = usage?.currentUsage || currentUsage

  return actualUsage < limit
}
```

### 2. API Route Protection

```typescript
// Example: app/api/products/route.ts
import { checkUsageLimit } from "@/lib/featureGate"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    throw new UnauthorizedError()
  }

  // Check product limit
  const productCount = await prisma.product.count({
    where: { vendorId: session.user.id },
  })

  const canAdd = await checkUsageLimit(
    session.user.id,
    "maxProducts",
    productCount
  )

  if (!canAdd) {
    return errorResponse(
      new Error("Product limit reached. Please upgrade your plan."),
      403
    )
  }

  // Continue with product creation...
}
```

### 3. Frontend Feature Gates

```typescript
// components/FeatureGate.tsx
"use client"

import { useSubscription } from "@/hooks/useSubscription"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Lock } from "lucide-react"

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, subscription } = useSubscription()

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Feature Not Available</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          This feature is not available on your current plan.
        </p>
        <Button onClick={() => window.location.href = "/settings/subscription"}>
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## 🔄 Migration Strategy

### 1. Database Migration

```bash
# Create migration
npx prisma migrate dev --name add_subscriptions

# Apply to production
npx prisma migrate deploy
```

### 2. Existing Users Migration

```typescript
// scripts/migrateExistingUsers.ts
import { prisma } from "@/root/lib/prisma"

async function migrateExistingUsers() {
  const users = await prisma.user.findMany({
    where: {
      subscription: null,
    },
  })

  for (const user of users) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "STARTER",
        status: "TRIAL",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log(`Migrated ${users.length} users to Starter plan`)
}

migrateExistingUsers()
```

---

## ✅ Testing

### 1. Unit Tests

```typescript
// __tests__/subscription.test.ts
import { checkFeatureAccess, checkUsageLimit } from "@/lib/featureGate"

describe("Feature Gating", () => {
  it("should allow feature access for active subscription", async () => {
    const hasAccess = await checkFeatureAccess("user-id", "cloudSync")
    expect(hasAccess).toBe(true)
  })

  it("should deny feature access for inactive subscription", async () => {
    const hasAccess = await checkFeatureAccess("user-id", "apiAccess")
    expect(hasAccess).toBe(false)
  })
})
```

### 2. Integration Tests

```typescript
// __tests__/api/subscriptions.test.ts
describe("Subscription API", () => {
  it("should create subscription", async () => {
    const response = await fetch("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({ plan: "PROFESSIONAL" }),
    })
    expect(response.status).toBe(200)
  })
})
```

---

## 📝 Implementation Checklist

- [ ] Update Prisma schema with subscription models
- [ ] Run database migration
- [ ] Set up Stripe account and get API keys
- [ ] Create Stripe products and prices
- [ ] Implement subscription API routes
- [ ] Set up webhook endpoint
- [ ] Create subscription management UI
- [ ] Implement feature gating middleware
- [ ] Add feature gates to existing features
- [ ] Create migration script for existing users
- [ ] Add subscription status checks to API routes
- [ ] Implement usage tracking
- [ ] Add subscription settings page
- [ ] Test payment flow
- [ ] Test webhook handling
- [ ] Add error handling and logging
- [ ] Create documentation
- [ ] Set up monitoring and alerts

---

## 🚀 Deployment Steps

1. **Staging Environment**
   - Deploy to staging
   - Test with Stripe test mode
   - Verify webhook handling
   - Test all subscription flows

2. **Production Deployment**
   - Update environment variables
   - Run database migration
   - Migrate existing users
   - Enable Stripe webhooks
   - Monitor for errors

3. **Post-Deployment**
   - Monitor subscription creation
   - Check webhook delivery
   - Verify payment processing
   - Review error logs

---

**Last Updated:** 2024
**Version:** 1.0

