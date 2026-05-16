import type { PlanFeatures } from "@/root/lib/subscription-plans"
import type { ShopType } from "./shopTypes"
import { getTabsForShopType } from "./shopTypes"
import type { VendorFeatureFlags } from "./vendorFeatures"
import { getVendorFeatureFlags } from "./vendorFeatures"

export type VendorTabId = string

export interface CanAccessTabInput {
  tabId: VendorTabId
  shopType: ShopType | string | null | undefined
  vendorFeatures?: VendorFeatureFlags
  planFeatures?: PlanFeatures | null
  isElectron?: boolean
  subscriptionGrantsFeatures?: boolean
}

/** Plan-gated tabs (hidden when subscription does not grant paid features). */
const SUBSCRIPTION_GATED_TABS: Partial<
  Record<VendorTabId, keyof PlanFeatures | ((p: PlanFeatures) => boolean)>
> = {
  rfid: "rfid",
  email: (p) => p.whatsappFlows,
  storefront: (p) => p.brandedSubdomain,
}

export function canAccessTab(input: CanAccessTabInput): boolean {
  const shopType = (input.shopType || "other") as ShopType
  const features = input.vendorFeatures ?? getVendorFeatureFlags(shopType)
  const shopTabs = getTabsForShopType(shopType)

  if (!shopTabs.includes(input.tabId)) return false

  if (input.tabId === "dine-qr") return features.dineTablesUi
  if (input.tabId === "accounting") return features.accountingModule
  if (input.tabId === "kitchen") return features.kitchenBoard
  if (input.tabId === "storefront" && input.isElectron) return false

  const plan = input.planFeatures
  const grants = input.subscriptionGrantsFeatures !== false
  const gate = SUBSCRIPTION_GATED_TABS[input.tabId]
  if (gate) {
    if (!plan || !grants) return false
    if (typeof gate === "function") return gate(plan)
    const value = plan[gate]
    if (typeof value === "boolean") return value
    if (typeof value === "number") return value === -1 || value > 0
    return false
  }

  return true
}

export function listAccessibleTabIds(input: Omit<CanAccessTabInput, "tabId">): string[] {
  const shopType = (input.shopType || "other") as ShopType
  return getTabsForShopType(shopType).filter((tabId) =>
    canAccessTab({ ...input, tabId })
  )
}
