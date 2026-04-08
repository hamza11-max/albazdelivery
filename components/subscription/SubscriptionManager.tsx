"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Check, Crown, Zap, Building, Rocket } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"
import { PLAN_DISPLAY_PRICING } from "@/root/lib/subscription-plans"

interface PlanInfo {
  name: string
  icon: typeof Zap
  features: string[]
}

const PLANS: Record<string, PlanInfo> = {
  STARTER: {
    name: "Starter",
    icon: Zap,
    features: [
      "Up to 50 products",
      "POS & basic inventory",
      "WhatsApp Flows ordering (linked store)",
      "≈1 month sales history in app",
      "Email support",
      "No cloud sync",
    ],
  },
  PROFESSIONAL: {
    name: "Professional",
    icon: Crown,
    features: [
      "Unlimited products",
      "Cloud sync",
      "Up to 3 staff users · 1 location",
      "WhatsApp Flows ordering (linked store)",
      "12 months history",
      "Email & phone support",
    ],
  },
  BUSINESS: {
    name: "Business",
    icon: Building,
    features: [
      "Everything in Professional",
      "Unlimited users & locations",
      "API access",
      "Priority support",
      "All-time history & reporting",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    icon: Rocket,
    features: [
      "Everything in Business",
      "RFID / loss-prevention tooling (Vendor+)",
      "Dedicated success & custom integrations",
      "SLA options",
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

function formatDzdAmount(raw: string): string {
  const n = parseInt(raw.replace(/\s/g, ""), 10)
  if (Number.isNaN(n)) return raw
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n)
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
          toast({
            title: "Payment required",
            description: "Please complete your payment to upgrade",
          })
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

      <p className="text-sm text-muted-foreground">
        Prix affichés en <strong>DZD</strong> (référence marché Algérie). Le prélèvement carte suit la devise
        configurée dans Stripe (souvent USD) selon vos tarifs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PLANS).map(([key, plan]) => {
          const Icon = plan.icon
          const isCurrent = currentPlan === key
          const isUpgrade = getPlanOrder(key) > getPlanOrder(currentPlan)
          const pricing = PLAN_DISPLAY_PRICING[key] ?? { dzd: "—" }
          const dzdDisplay = formatDzdAmount(pricing.dzd)

          return (
            <Card key={key} className={isCurrent ? "border-primary border-2" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div>
                  <div className="text-3xl font-bold tabular-nums">
                    {dzdDisplay}
                    <span className="text-base font-semibold text-muted-foreground ms-1.5">DZD</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">/ mois</div>
                  {pricing.usdHint ? (
                    <p className="text-xs text-muted-foreground mt-2 leading-snug">{pricing.usdHint}</p>
                  ) : null}
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
