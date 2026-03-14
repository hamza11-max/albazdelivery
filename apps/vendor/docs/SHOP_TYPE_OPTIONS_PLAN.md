# Shop type – separate options per business (vendor app)

## Goal

During **installation/setup**, the user chooses their **shop type** (e.g. restaurant, clothes shop, grocery). After setup, the app shows only **tabs and options relevant to that type** (e.g. restaurants see Orders, Drivers, Schedule; clothes shops see Inventory, Suppliers; not the other way around).

---

## 1. Shop types (canonical list)

Define a small set of types. Backend already has `User.shopType` and `Store.type` (string). Use the same values everywhere.

| Id | Label (FR) | Label (AR) | Typical use |
|----|------------|------------|-------------|
| `restaurant` | Restaurant / Café | مطعم / مقهى | Orders, delivery, drivers, schedule, prep time |
| `retail` | Commerce (vêtements, etc.) | تجارة (ملابس، إلخ) | Inventory, suppliers, POS, no delivery flow |
| `grocery` | Épicerie / Supermarché | بقالة / سوبرماركت | Mix: inventory, orders, delivery |
| `other` | Autre | أخرى | All options or minimal set |

You can add more later (e.g. `pharmacy`, `bakery`) without changing the architecture.

---

## 2. When the user chooses shop type

**During first-time setup (Electron desktop):**

- Current flow: **Passkey** → **Owner** (name, phone, email, password) → **Login**.
- Add **shop type** in one of these ways:
  - **Option A (recommended):** New step **after passkey, before owner**: “What type of business?” → list of types (restaurant, retail, grocery, other) → then owner form.
  - **Option B:** Add a “Type de commerce” dropdown on the **owner** step (same screen as name/email/password).

**Persistence:**

- **Electron:** In `electron-store` (e.g. `vendor-auth`), add a key like `shop_type` (value: `restaurant` | `retail` | `grocery` | `other`). Set it when the user completes the step where they choose the type.
- **Backend (optional):** When registering the owner or creating/updating the Store, send `shopType` / `type` so the cloud and other apps stay in sync. Backend already has `User.shopType` and `Store.type`.

**Web (non-Electron):** If the vendor app is also used in browser, shop type can be asked on first login or in a “Complete your profile” step and stored in the user/store in the API.

---

## 3. Which options each shop type sees

### 3.1 Sidebar tabs (navigation)

| Tab id | Restaurant | Retail | Grocery | Other |
|--------|-------------|--------|---------|--------|
| dashboard | ✅ | ✅ | ✅ | ✅ |
| pos | ✅ | ✅ | ✅ | ✅ |
| inventory | ✅ | ✅ | ✅ | ✅ |
| orders | ✅ | ❌ | ✅ | ✅ |
| drivers | ✅ | ❌ | ✅ | ✅ |
| sales | ✅ | ✅ | ✅ | ✅ |
| reports | ✅ | ✅ | ✅ | ✅ |
| coupons | ✅ | ✅ | ✅ | ✅ |
| sync-save | ✅ | ✅ | ✅ | ✅ |
| email | ✅ | ✅ | ✅ | ✅ |
| staff-permissions | ✅ | ✅ | ✅ | ✅ |
| clients-loyalty | ✅ | ✅ | ✅ | ✅ |
| suppliers | ❌ | ✅ | ✅ | ✅ |
| ai | ✅ | ✅ | ✅ | ✅ |
| settings | ✅ | ✅ | ✅ | ✅ |
| logout | ✅ | ✅ | ✅ | ✅ |

- **Restaurant:** Orders + Drivers (delivery), no Suppliers tab.
- **Retail:** Suppliers (and inventory), no Orders, no Drivers.
- **Grocery:** Both orders/drivers and suppliers.
- **Other:** Show everything (or a minimal set; you can tune).

You can change this matrix later by editing a single config (see below).

### 3.2 Settings tab – sections

Inside the **Settings** tab, some sections are business-specific:

| Section | Restaurant | Retail | Grocery | Other |
|---------|------------|--------|---------|--------|
| Staff & roles | ✅ | ✅ | ✅ | ✅ |
| Horaires & capacité (menu schedule) | ✅ | ❌ | ✅ | ✅ |
| Temps de préparation (prep time) | ✅ | ❌ | ✅ | ✅ |
| Max commandes / heure | ✅ | ❌ | ✅ | ✅ |
| Pause hors horaires | ✅ | ❌ | ✅ | ✅ |
| Paiements et réclamations | ✅ | ✅ | ✅ | ✅ |
| (any other global settings) | ✅ | ✅ | ✅ | ✅ |

So:

- **Restaurant:** Schedule, prep time, orders/hour, auto-pause (delivery-oriented).
- **Retail:** No schedule/prep/orders per hour; focus on staff and payouts.
- **Grocery / Other:** Can show all of the above.

---

## 4. Implementation plan

### Step 1: Define config and types (app side)

- Add a **shop type** constant and a **feature matrix** in the vendor app, e.g.:
  - File: `apps/vendor/config/shopTypes.ts` (or `lib/shopTypes.ts`).
  - Export: `SHOP_TYPES = ['restaurant', 'retail', 'grocery', 'other']`, labels, and two helpers:
    - `getTabsForShopType(shopType): string[]` → list of tab ids to show.
    - `getSettingsSectionsForShopType(shopType): string[]` or a map of section id → visible (e.g. `schedule`, `prepTime`, `payouts`).
- Use a single source of truth so changing the matrix only requires editing this file.

### Step 2: Persist shop type at setup (Electron)

- **Login page (setup):**
  - If you use **Option A**, add a step between passkey and owner: “Type de commerce” with buttons or a select (restaurant, retail, grocery, other). On submit, call a new IPC e.g. `auth-set-shop-type` and then go to owner step.
  - If you use **Option B**, add a dropdown to the owner form and send `shopType` in the existing `auth-setup-owner` payload.
- **Main process (`main.js`):**
  - Add IPC handler `auth-set-shop-type` that writes `shop_type` to the same electron-store used for auth (e.g. `vendor-auth`). If you use Option B, in `auth-setup-owner` save `shop_type` from the payload.
  - In `getSetupState()` (or equivalent), also return `shopType` so the renderer can use it.
- **Preload:** Expose `auth.getShopType()`, `auth.setShopType(shopType)`, and ensure `auth.getSetup()` (or auth state) includes `shopType` after setup.

### Step 3: Expose shop type to the app

- **Electron:** Renderer gets shop type via `auth.getShopType()` or from the object returned by `auth.getSetup()` / auth state. If not set (legacy install), default to `other` so all options stay visible until the user sets a type.
- **Web:** If the vendor runs in browser, get shop type from the session/API (e.g. from User or Store) and pass it down like in Electron.

### Step 4: Filter sidebar by shop type

- **VendorSidebar** (or wherever the sidebar menu is built):
  - Get current `shopType` (from context, hook, or props).
  - Build the list of menu items from the **full** list, then filter with `getTabsForShopType(shopType)` so only allowed tab ids are shown. Optionally hide “logout” from the matrix and always show it.
  - Mobile bottom nav: filter the same list (e.g. “first 5” of the filtered tabs + Settings/More).

### Step 5: Filter Settings content by shop type

- In the **Settings** tab component (vendor page or SettingsTab):
  - Get `shopType`, then use `getSettingsSectionsForShopType(shopType)`.
  - Render only sections whose id is in that list (e.g. “Horaires & capacité”, “Temps de préparation”, “Paiements”, etc.). No need to remove code: just conditional render with the same matrix.

### Step 6: Optional – change shop type later

- In Settings, add a card “Type de commerce” (or “Business type”) with a dropdown: current value + same list (restaurant, retail, grocery, other). On change:
  - **Electron:** Call `auth.setShopType(newType)` (IPC → electron-store).
  - **Web/API:** PATCH user or store with new `shopType`/`type`.
  - Reload or re-filter sidebar/settings so the new type takes effect without restart.

### Step 7: Sync with backend (optional)

- When creating/updating the store or user (registration, profile update), send `shopType` so that:
  - `User.shopType` and/or `Store.type` are set in the database.
  - Other clients (e.g. customer app, admin) can use the same type for filtering or display.

---

## 5. File checklist

| Area | File(s) | Change |
|------|---------|--------|
| Config | `apps/vendor/config/shopTypes.ts` or `lib/shopTypes.ts` | New: SHOP_TYPES, labels, getTabsForShopType, getSettingsSectionsForShopType |
| Setup UI | `apps/vendor/app/login/page.tsx` | New step or field: choose shop type, call setShopType / include in setupOwner |
| Electron main | `apps/vendor/electron/main.js` | getSetupState: include shopType; add auth-set-shop-type and/or extend auth-setup-owner to save shop_type |
| Preload | `apps/vendor/electron/preload.js` | Expose getShopType, setShopType; ensure getSetup returns shopType |
| Sidebar | `components/VendorSidebar.tsx` (or app-specific sidebar) | Read shopType; filter menu items by getTabsForShopType(shopType) |
| Vendor page | `apps/vendor/app/vendor/page.tsx` | Pass shopType to sidebar; in Settings tab, show only sections from getSettingsSectionsForShopType(shopType) |
| Settings (change type) | Same Settings tab | Optional: “Type de commerce” dropdown, call setShopType + API if needed |

---

## 6. Default / migration

- **Existing installs** that never chose a type: treat as `shopType = 'other'` (show all tabs and settings) so behavior does not change until you want.
- **New installs:** Require choosing a type in the setup flow so `shop_type` is always set before first use of the dashboard.

---

## 7. Summary

1. **Define** shop types and a **feature matrix** (tabs + settings sections per type).
2. **Ask** shop type during setup (new step or on owner form); **persist** in electron-store and optionally in API (User/Store).
3. **Sidebar:** Filter menu items by shop type so only relevant tabs are visible.
4. **Settings:** Show only the settings sections allowed for that shop type.
5. **Optional:** Allow changing shop type in Settings and sync to backend.

Result: after installation the user sees only the options that make sense for their business (e.g. restaurants get Orders/Drivers/Schedule; clothes shops get Inventory/Suppliers; no mixing).

---

## Appendix: Example config (TypeScript)

```ts
// apps/vendor/config/shopTypes.ts (or lib/shopTypes.ts)

export const SHOP_TYPES = ['restaurant', 'retail', 'grocery', 'other'] as const
export type ShopType = (typeof SHOP_TYPES)[number]

export const SHOP_TYPE_LABELS: Record<ShopType, { fr: string; ar: string }> = {
  restaurant: { fr: 'Restaurant / Café', ar: 'مطعم / مقهى' },
  retail:     { fr: 'Commerce (vêtements, etc.)', ar: 'تجارة (ملابس، إلخ)' },
  grocery:    { fr: 'Épicerie / Supermarché', ar: 'بقالة / سوبرماركت' },
  other:      { fr: 'Autre', ar: 'أخرى' },
}

const TABS_BY_SHOP_TYPE: Record<ShopType, string[]> = {
  restaurant: ['dashboard','pos','inventory','orders','drivers','sales','reports','coupons','sync-save','email','staff-permissions','clients-loyalty','ai','settings','logout'],
  retail:     ['dashboard','pos','inventory','sales','reports','coupons','sync-save','email','staff-permissions','clients-loyalty','suppliers','ai','settings','logout'],
  grocery:    ['dashboard','pos','inventory','orders','drivers','sales','reports','coupons','sync-save','email','staff-permissions','clients-loyalty','suppliers','ai','settings','logout'],
  other:      ['dashboard','pos','inventory','orders','drivers','sales','reports','coupons','sync-save','email','staff-permissions','clients-loyalty','suppliers','ai','settings','logout'],
}

export function getTabsForShopType(shopType: ShopType | null | undefined): string[] {
  return TABS_BY_SHOP_TYPE[shopType && SHOP_TYPES.includes(shopType as ShopType) ? shopType as ShopType : 'other']
}

const SETTINGS_SECTIONS_BY_SHOP_TYPE: Record<ShopType, string[]> = {
  restaurant: ['staff','schedule','prepTime','ordersPerHour','payouts'],
  retail:     ['staff','payouts'],
  grocery:    ['staff','schedule','prepTime','ordersPerHour','payouts'],
  other:      ['staff','schedule','prepTime','ordersPerHour','payouts'],
}

export function getSettingsSectionsForShopType(shopType: ShopType | null | undefined): string[] {
  return SETTINGS_SECTIONS_BY_SHOP_TYPE[shopType && SHOP_TYPES.includes(shopType as ShopType) ? shopType as ShopType : 'other']
}
```
