# Vendor App Refactoring Progress

## Current baseline (2026-05)

| Metric | Value |
|--------|--------|
| `app/vendor/page.tsx` line count | ~3,470 (after `VendorShell` extraction and `drivers-old` removal) |
| Target for composition-only page | &lt; 400 lines (ongoing) |

## Completed in vendor refactor plan

### Registration (Phase 1)

- [`lib/auth/vendor-registration-policy.ts`](../../lib/auth/vendor-registration-policy.ts) — server-side web vs Electron auto-approve rules
- [`lib/auth/register-client.ts`](../../lib/auth/register-client.ts) — shared client submit helper
- [`components/auth/VendorSignupForm.tsx`](../../components/auth/VendorSignupForm.tsx) — vendor signup UI
- [`apps/vendor/app/signup/page.tsx`](app/signup/page.tsx) — local `/signup` route
- [`apps/vendor/app/api/auth/register/route.ts`](app/api/auth/register/route.ts) — re-exports root register API
- Electron owner setup uses policy + pending approval step on login

### Shell & entitlements (Phase 2–3)

- [`components/layout/VendorShell.tsx`](components/layout/VendorShell.tsx) — topbar, menu, subscription banner, tab container
- [`config/vendorEntitlements.ts`](config/vendorEntitlements.ts) — `canAccessTab` / `listAccessibleTabIds`
- [`config/vendorTabRegistry.ts`](config/vendorTabRegistry.ts) — tab id registry
- Removed hidden `drivers-old` duplicate drivers UI
- Deleted unused tab modules: `CloudSyncTab`, `BackupTab`, `PermissionsTab`, `AIInsightsTab` (vendor app)

### API & docs (Phase 4–5)

- [`docs/API_PARITY.md`](docs/API_PARITY.md) — proxy vs duplicate routes
- Restored auth on [`app/api/admin/users/route.ts`](app/api/admin/users/route.ts) (dev bypass flag only)
- Root [`app/vendor/page.tsx`](../../app/vendor/page.tsx) redirects to canonical vendor app

## Domains UI (deduped)

- **Vendor portal hostname** (subdomain / BYOD): [`VendorSecuritySettingsPanel`](components/security/VendorSecuritySettingsPanel.tsx) in Settings → Security (web + Electron)
- **Per-store domains**: [`VendorStorefrontWebPanel`](components/VendorStorefrontWebPanel.tsx) storefront tab + [`settings/domains`](app/vendor/settings/domains/page.tsx)
- Storefront tab links to Settings → Security for vendor hostname setup

## ERP API (consolidated)

Shared handlers in [`lib/api-handlers/erp/`](../../lib/api-handlers/erp/). Vendor and root `app/api/erp/*/route.ts` are one-line re-exports.

## Remaining

- Further shrink `page.tsx` by moving settings sub-panels to dedicated components
- Consolidate remaining duplicate routes (domains, passkeys, subscriptions)
