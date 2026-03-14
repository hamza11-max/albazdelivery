/**
 * Shop type configuration: which tabs and settings sections each business type sees.
 * Used at setup (Option A) and to filter sidebar + Settings in the vendor app.
 */

export const SHOP_TYPES = ['restaurant', 'retail', 'grocery', 'other'] as const
export type ShopType = (typeof SHOP_TYPES)[number]

export const SHOP_TYPE_LABELS: Record<ShopType, { fr: string; ar: string }> = {
  restaurant: { fr: 'Restaurant / Café', ar: 'مطعم / مقهى' },
  retail: { fr: 'Commerce (vêtements, etc.)', ar: 'تجارة (ملابس، إلخ)' },
  grocery: { fr: 'Épicerie / Supermarché', ar: 'بقالة / سوبرماركت' },
  other: { fr: 'Autre', ar: 'أخرى' },
}

const TABS_BY_SHOP_TYPE: Record<ShopType, string[]> = {
  restaurant: [
    'dashboard',
    'pos',
    'inventory',
    'orders',
    'drivers',
    'sales',
    'reports',
    'coupons',
    'sync-save',
    'email',
    'staff-permissions',
    'clients-loyalty',
    'ai',
    'settings',
    'logout',
  ],
  retail: [
    'dashboard',
    'pos',
    'inventory',
    'sales',
    'reports',
    'coupons',
    'sync-save',
    'email',
    'staff-permissions',
    'clients-loyalty',
    'suppliers',
    'ai',
    'settings',
    'logout',
  ],
  grocery: [
    'dashboard',
    'pos',
    'inventory',
    'orders',
    'drivers',
    'sales',
    'reports',
    'coupons',
    'sync-save',
    'email',
    'staff-permissions',
    'clients-loyalty',
    'suppliers',
    'ai',
    'settings',
    'logout',
  ],
  other: [
    'dashboard',
    'pos',
    'inventory',
    'orders',
    'drivers',
    'sales',
    'reports',
    'coupons',
    'sync-save',
    'email',
    'staff-permissions',
    'clients-loyalty',
    'suppliers',
    'ai',
    'settings',
    'logout',
  ],
}

export function getTabsForShopType(shopType: ShopType | null | undefined): string[] {
  const key: ShopType =
    shopType && (SHOP_TYPES as readonly string[]).includes(shopType) ? (shopType as ShopType) : 'other'
  return TABS_BY_SHOP_TYPE[key]
}

/** Settings section ids used to show/hide blocks in the Settings tab */
export const SETTINGS_SECTION_IDS = ['staff', 'schedule', 'prepTime', 'ordersPerHour', 'payouts'] as const
export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number]

const SETTINGS_SECTIONS_BY_SHOP_TYPE: Record<ShopType, SettingsSectionId[]> = {
  restaurant: ['staff', 'schedule', 'prepTime', 'ordersPerHour', 'payouts'],
  retail: ['staff', 'payouts'],
  grocery: ['staff', 'schedule', 'prepTime', 'ordersPerHour', 'payouts'],
  other: ['staff', 'schedule', 'prepTime', 'ordersPerHour', 'payouts'],
}

export function getSettingsSectionsForShopType(
  shopType: ShopType | null | undefined
): SettingsSectionId[] {
  const key: ShopType =
    shopType && (SHOP_TYPES as readonly string[]).includes(shopType) ? (shopType as ShopType) : 'other'
  return SETTINGS_SECTIONS_BY_SHOP_TYPE[key]
}

export function isSettingsSectionVisible(
  shopType: ShopType | null | undefined,
  sectionId: SettingsSectionId
): boolean {
  return getSettingsSectionsForShopType(shopType).includes(sectionId)
}
