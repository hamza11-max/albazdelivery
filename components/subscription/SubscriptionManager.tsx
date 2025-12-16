"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Crown, Zap, Building, Rocket, Lock } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"

interface PlanInfo {
  name: string
  price: string
  icon: typeof Zap
  features: string[]
}

const PLANS: Record<string, PlanInfo> = {
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

function getPlanOrder(plan: string): number {
  const order: Record<string, number> = {
    STARTER: 0,
    PROFESSIONAL: 1,
    BUSINESS: 2,
    ENTERPRISE: 3,
  }
  return order[plan] || 0
}

export function SubscriptionManager() {
  const { subscription, loading, refetch } = useSubscription()
  const [upgrading, setUpgrading] = useState(false)
  const { toast } = useToast()

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
          toast({
            title: "Payment required",
            description: "Please complete your payment to upgrade",
          })
          // TODO: Integrate Stripe Elements for payment
        } else {
          toast({
            title: "Subscription updated",
            description: `You are now on the ${PLANS[plan as keyof typeof PLANS]?.name || plan} plan`,
          })
          refetch()
        }
      } else {
        throw new Error(data.error || "Failed to update subscription")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
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
        refetch()
      } else {
        throw new Error(data.error || "Failed to cancel subscription")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
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
                  {PLANS[currentPlan as keyof typeof PLANS]?.name || currentPlan}
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
            <Card key={key} className={isCurrent ? "border-primary border-2" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  {plan.price}
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

