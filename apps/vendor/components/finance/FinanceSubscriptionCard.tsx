"use client"

import {
  VendorSubscriptionTrialPanel,
  type VendorSubscriptionLite,
} from "../VendorSubscriptionTrialPanel"

type Translate = (fr: string, ar: string) => string

export function FinanceSubscriptionCard({
  translate,
  subscription,
  loading,
  onUpdated,
}: {
  translate: Translate
  subscription: VendorSubscriptionLite | null
  loading: boolean
  onUpdated: () => Promise<void>
}) {
  return (
    <VendorSubscriptionTrialPanel
      variant="card"
      translate={translate}
      subscription={subscription}
      loading={loading}
      onUpdated={onUpdated}
    />
  )
}
