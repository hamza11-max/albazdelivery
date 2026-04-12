import type { ShopType } from "./shopTypes"

export type VendorFeatureKey =
  | "labelPrinting"
  | "qrGuestOrdering"
  | "accountingModule"
  | "dineTablesUi"
  | "kitchenBoard"

export type VendorFeatureFlags = Record<VendorFeatureKey, boolean>

const DEFAULT_FLAGS: VendorFeatureFlags = {
  labelPrinting: true,
  qrGuestOrdering: false,
  accountingModule: false,
  dineTablesUi: false,
  kitchenBoard: false,
}

const BY_SHOP: Partial<Record<ShopType, Partial<VendorFeatureFlags>>> = {
  restaurant: {
    labelPrinting: false,
    qrGuestOrdering: true,
    accountingModule: true,
    dineTablesUi: true,
    kitchenBoard: true,
  },
}

export function getVendorFeatureFlags(shopType: string | null | undefined): VendorFeatureFlags {
  const key = shopType as ShopType
  const patch = key && BY_SHOP[key] ? BY_SHOP[key] : {}
  return { ...DEFAULT_FLAGS, ...patch }
}
