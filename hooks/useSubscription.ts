"use client"

import { useState, useEffect } from "react"
import { PLAN_FEATURES, type PlanFeatures } from "@/root/lib/stripe"

interface Subscription {
  id: string
  plan: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  usage?: Array<{
    feature: string
    currentUsage: number
    limit: number
  }>
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/subscriptions")
      const data = await res.json()
      if (data.success) {
        setSubscription(data.data)
      } else {
        setError(data.error || "Failed to fetch subscription")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch subscription")
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!subscription || subscription.status !== "ACTIVE") {
      return false
    }

    const planFeatures = PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES]
    if (!planFeatures) return false

    const value = planFeatures[feature]
    return value === true || value === -1
  }

  const getLimit = (feature: keyof PlanFeatures): number => {
    if (!subscription || subscription.status !== "ACTIVE") {
      return 0
    }

    const planFeatures = PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES]
    if (!planFeatures) return 0

    return (planFeatures[feature] as number) || 0
  }

  const checkLimit = (feature: keyof PlanFeatures, currentUsage: number): boolean => {
    const limit = getLimit(feature)
    if (limit === -1) return true // unlimited
    return currentUsage < limit
  }

  const getUsage = (feature: string) => {
    if (!subscription?.usage) return null
    return subscription.usage.find((u) => u.feature === feature)
  }

  return {
    subscription,
    loading,
    error,
    hasFeature,
    getLimit,
    checkLimit,
    getUsage,
    refetch: fetchSubscription,
  }
}

