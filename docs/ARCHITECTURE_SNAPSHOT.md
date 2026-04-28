# Architecture snapshot (concise)

*Living summary for auditors and onboarding. Canonical technical audit: [TECHNICAL_PROJECT_AUDIT.md](TECHNICAL_PROJECT_AUDIT.md).*

## Product shape

- **Monorepo:** Root Next.js **App Router** app (`app/`) hosting shared **`app/api/*`** REST routes; satellite apps under **`apps/vendor`**, **`apps/admin`**, **`apps/customer`**, **`apps/driver`** (Electron-capable vendor flow).
- **Auth:** NextAuth / Auth.js v5 (`lib/auth.config.ts`), roles `CUSTOMER` | `VENDOR` | `DRIVER` | `ADMIN`; approved-user gating where configured.
- **Data:** Postgres + **Prisma** (`prisma/schema.prisma`). Orders, subscriptions, storefront **`Product`** (per **Store**), and ERP **`InventoryProduct`** are **separate** concepts — see [ERP_CATALOG_VS_STOREFRONT_PRODUCT.md](ERP_CATALOG_VS_STOREFRONT_PRODUCT.md).
- **Payments:** Stripe (intents + **subscription** webhooks with idempotency table); structured logs and optional Sentry in webhook path (`lib/observability/money-path-log.ts`).

## Cross-cutting infrastructure

| Concern | Where |
|--------|--------|
| Rate limits | `lib/rate-limit.ts`; Upstash when env set |
| Middleware | Root `middleware.ts` — storefront host rewrites, CSRF/security headers |
| Background queues | Optional BullMQ when `REDIS_HOST` — [BACKGROUND_JOBS_AND_REDIS.md](BACKGROUND_JOBS_AND_REDIS.md) |
| Notifications | In-app DB + SSE; SMTP/Twilio optional — [NOTIFICATION_CHANNELS.md](NOTIFICATION_CHANNELS.md) |

## Verification scripts

| Command | Scope |
|---------|--------|
| `npm run verify:phase-a` | Rate-limit CI check + typecheck + core API Jests |
| `npm run verify:phase-b` | Phase A + money-path-log Jest |
| `npm run verify:phase-c` | Phase B + Phase C Playwright slice |
