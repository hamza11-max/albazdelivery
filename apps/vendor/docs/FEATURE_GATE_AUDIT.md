# Vendor feature gating — audit (gap sweep)

**Date:** 2026-05-12  
**Scope:** Server `checkFeatureAccess` / client `FeatureGate` / `useSubscription().hasFeature` on vendor surfaces.

## Summary

| Mechanism | Where used today |
|-----------|-------------------|
| `checkFeatureAccess(userId, feature)` | `lib/vendor-invite-driver.ts` (`driverFleetManagement`), `apps/vendor/app/api/vendors/orders` PATCH (`driverFleetManagement` when setting `driverId`), new `PATCH /api/vendors/drivers/:driverId/status` |
| `useSubscription().hasFeature` | `apps/vendor/app/vendor/page.tsx` — Drivers tab, Orders tab driver picker / invite |
| `<FeatureGate />` | Shared component under `components/subscription/FeatureGate.tsx` — **not** wired across most vendor dashboard tabs (tabs use ad-hoc checks or none) |

## API routes (apps/vendor) — gaps

Most `apps/vendor/app/api/**` routes enforce **auth + role** only. They do **not** call `checkFeatureAccess` for plan features (e.g. `cloudSync`, `apiAccess`, `whatsappFlows`, `maxProducts`). Examples:

- `app/api/erp/**` (inventory, sales, …)
- `app/api/vendors/orders` — status-only updates on root web route; **Electron** route extends PATCH with `driverId` + gate
- `app/api/vendor/**` (if any thin proxies)

**Recommendation:** For each **paid** capability exposed by a route, add `checkFeatureAccess(vendorOwnerId, '<feature>')` at the top of the handler (resolve owner via `resolveVendorOwnerContextId` for staff).

## Vendor UI — gaps

Heavy tabs (POS, inventory, storefront, staff, RFID) generally **do not** wrap content in `<FeatureGate>`. They rely on:

- Subscription banners / settings UX, or
- No hard block (user can hit API errors if plan insufficient)

**Upgrade CTA:** `FeatureGate` dispatches `switchTab` with detail `settings` — verified in `components/subscription/FeatureGate.tsx`. Pages that do not use `FeatureGate` should duplicate that pattern if you add gates.

## Sprint doc alignment

- **Invite API path:** Implemented as `POST /api/vendors/drivers/invite` (plural `vendors`), plus root mirror under `app/api/vendors/drivers/invite` for web — not `/api/vendor/...`.
- **Driver status API:** `PATCH /api/vendors/drivers/:driverId/status` with body `{ availableForDispatch: boolean }` (vendor dispatch pool; not driver GPS `DriverLocation`).

## Next steps (optional)

1. Add `checkFeatureAccess` to ERP mutations that map to `PLAN_FEATURES` (e.g. catalog limits already partially enforced elsewhere).
2. Wrap premium tabs in `FeatureGate` or a thin `VendorFeatureGate` wrapper that uses `hasFeature` once per tab.
