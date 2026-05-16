# Vendor app API parity

The vendor Electron/Next app (`apps/vendor`) mirrors many routes from the monorepo root `app/api/`.

## Proxy / re-export (prefer root implementation)

| Vendor route | Implementation |
|--------------|----------------|
| `app/api/auth/register/route.ts` | `app/api/auth/register/route.ts` |
| `app/api/auth/check-status/route.ts` | `app/api/auth/check-status/route.ts` |
| `app/api/erp/dashboard/route.ts` | `lib/api-handlers/erp/dashboard.ts` |
| `app/api/erp/inventory/route.ts` | `lib/api-handlers/erp/inventory.ts` |
| `app/api/erp/customers/route.ts` | `lib/api-handlers/erp/customers.ts` |
| `app/api/erp/sales/route.ts` | `lib/api-handlers/erp/sales.ts` |
| `app/api/erp/suppliers/route.ts` | `lib/api-handlers/erp/suppliers.ts` |
| `app/api/erp/ai-insights/route.ts` | `lib/api-handlers/erp/ai-insights.ts` |
| `app/api/erp/categories/route.ts` | `lib/api-handlers/erp/categories.ts` |

Root `app/api/erp/*/route.ts` re-exports the same handlers via `@/lib/api-handlers/erp/*`.

Handlers use `getSessionFromRequest` (NextAuth cookie + Electron Bearer JWT) and include Electron offline fallbacks where applicable.

## Vendor-local copies (not yet consolidated)

Vendor domains, stores, passkeys, and subscriptions under `apps/vendor/app/api/` may still duplicate root routes for standalone `next dev` on port 3001.

## Security

- `app/api/admin/users` — auth required unless `NODE_ENV=development` and `ALLOW_VENDOR_ADMIN_USERS_WITHOUT_AUTH=1`.
