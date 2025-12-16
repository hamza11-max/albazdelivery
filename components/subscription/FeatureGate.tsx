"use client"

import { useSubscription } from "@/hooks/useSubscription"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Lock } from "lucide-react"

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgrade?: boolean
}

export function FeatureGate({ feature, children, fallback, showUpgrade = true }: FeatureGateProps) {
  const { hasFeature, subscription } = useSubscription()

  if (hasFeature(feature as any)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgrade) {
    return null
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Feature Not Available</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          This feature is not available on your current plan ({subscription?.plan || "STARTER"}).
        </p>
        <Button onClick={() => {
          const vendorPage = document.querySelector('[data-vendor-page]')
          if (vendorPage) {
            // If we're in vendor page, switch to settings tab
            const event = new CustomEvent('switchTab', { detail: 'settings' })
            window.dispatchEvent(event)
          } else {
            window.location.href = "/vendor?tab=settings"
          }
        }}>
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  )
}

