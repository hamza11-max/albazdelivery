/**
 * Registry of vendor dashboard tabs — metadata for navigation and entitlements.
 * Tab UI lives in `components/tabs/*`; this file is the single list of tab ids.
 */

export const VENDOR_TAB_IDS = [
  "dashboard",
  "inventory",
  "pos",
  "orders",
  "kitchen",
  "dine-qr",
  "accounting",
  "sales",
  "reports",
  "coupons",
  "sync-save",
  "email",
  "storefront",
  "staff-permissions",
  "clients-loyalty",
  "drivers",
  "suppliers",
  "ai",
  "rfid",
  "settings",
] as const

export type VendorTabRegistryId = (typeof VENDOR_TAB_IDS)[number]

export interface VendorTabRegistryEntry {
  id: VendorTabRegistryId
  /** Optional subscription feature key from PlanFeatures */
  planFeature?: keyof import("@/root/lib/subscription-plans").PlanFeatures
}

export const VENDOR_TAB_REGISTRY: VendorTabRegistryEntry[] = VENDOR_TAB_IDS.map((id) => ({
  id,
  ...(id === "rfid" ? { planFeature: "rfid" as const } : {}),
  ...(id === "email" ? { planFeature: "whatsappFlows" as const } : {}),
  ...(id === "storefront" ? { planFeature: "brandedSubdomain" as const } : {}),
}))
