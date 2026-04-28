# Technical Project Audit — Product Delivery Analysis

**Generated:** 2026-04-27  
**Last updated:** 2026-04-29 (Phases A–C closed; `ADMIN_ENHANCEMENTS.md` numbered phases **1–5** checklist reflected below)  
**Scope:** Codebase, schema, tests, git history, and in-repository documentation.  
**Limitation:** No access to private owner–developer tickets or external conversations; “claims vs reality” is derived from repository evidence only.

---

## Post-audit implementation (same release window)

The following **roadmap items were implemented in code and docs** (verify in git history for exact paths):

| Area | What changed |
|------|----------------|
| **Rate limiting** | `lib/rate-limit.ts`: `applyRateLimit` is **`async`**, all known call sites use **`await`**, and standard `rateLimitConfigs.*` presets **map to Upstash Ratelimit** when `UPSTASH_REDIS_*` is set. Script: `scripts/add-await-apply-rate-limit.mjs`. Jest: `__tests__/api/lib/rate-limit-apply.test.ts`. |
| **Subscriptions** | `lib/api-subscriptions.ts`: **GET** returns `{ subscription: null }` without auto-creating; **POST STARTER** requires **development** or **`ALLOW_STARTER_PLAN_WITHOUT_STRIPE=1`**. Responses normalized to `{ subscription }` where needed; `hooks/useSubscription.ts` + `components/subscription/SubscriptionManager.tsx` updated. **ENV_TEMPLATE.md** documents the flag. |
| **Guest / dine-in** | `lib/guest-orders-deployment.ts`: **503** on Vercel unless **`GUEST_ORDERS_ALLOW_ON_VERCEL=1`** (after DB migration) or use desktop/Electron. `ServiceUnavailableError` in `lib/errors.ts`. |
| **Admin subscription passkeys** | `app/api/admin/subscription-passkeys/route.ts`: **removed** try/catch that swallowed rate-limit errors. |
| **Duplicate API trees** | Root **`app/api/**`**: legacy nested **`delivery/`**, **`driver/`**, **`erp/`**, **`vendors/`**, **`drivers/`**, and **`auth`** deep trees **re-export** canonical handlers (`@deprecated`). *Out of scope here:* duplicate routes inside **`apps/*`** workspaces (normalize in Phase B as needed). |
| **E2E** | **`tests-e2e/api-smoke.spec.ts`** (public APIs) + **`tests-e2e/auth.spec.ts`** (login form, validation, failed sign-in). Playwright uses root **`next dev --webpack`**. *Still open (Phase B/C):* registration → order → payment e2e. |
| **Staff permissions** | **Documented** in [VENDOR_STAFF_PERMISSIONS.md](VENDOR_STAFF_PERMISSIONS.md) (client-only model; server RBAC still future work). |
| **Admin (feature phases 1–5)** | [ADMIN_ENHANCEMENTS.md](../ADMIN_ENHANCEMENTS.md) checklist: user mgmt through **analytics & exports** (**`GET /api/admin/analytics`**, **`GET /api/admin/analytics/live`**, **`POST /api/admin/export`**), zones / catalog / promos / broadcast / read-only **`system/config`**; UI tabs (**Contenu**, **Analytique**). Same handlers mirrored under root **`app/api/admin/`** next to **`apps/admin`**. **Not resolved by this:** payer **payouts** (still backlog); **universal** CSRF + admin role checks on **every** mutating route (ongoing Phase 0 item in enhancements doc). |

**Explicitly not in Phase A scope (see Phase B/C):** payment/checkout **`test.skip`** removal; order/refund webhook idempotency beyond subscriptions; queue/DLQ; **server-side staff sub-roles**; deduplicating **every** `app/api` copy under **`apps/*`**; Postgres-backed guest orders; full admin CSRF audit across all mutating routes.

---

## Executive Summary

The codebase is a **large Next.js 16 monorepo** (root app plus `apps/vendor`, `apps/admin`, `apps/customer`, mobile copies) with a **solid Prisma/Postgres model** for marketplace concepts (users, orders, payments, subscriptions, WebAuthn, domains, ERP-style inventory, etc.). Substantial UI and API surface **exist and are not trivial stubs**.

The brutal truth: **it is not a single, coherent, production-hardened product at one quality bar**. The issues below are **partly mitigated** (rate limits, subscription GET/POST rules, guest orders on Vercel, some API deduplication, passkey rate-limit behavior, broader **admin** analytics/content/export surfaces) but **gaps remain** (money-path tests, server staff RBAC, full duplicate-route cleanup, queue-based recovery). You still have **enterprise-shaped schema and UI** mixed with **local-file** guest flow on some deployments, **client-only “staff permissions”** (now documented), and **test coverage that does not back core money paths**. The repository also contains an unusually large set of “FINAL / COMPLETE / 100%” markdown files that **read like delivery theatre** and should not be treated as evidence of completion.

---

## Real Completion Percentage

*Subjective but evidence-based; “100%” means shippable with confidence, not “files exist”.*

| Area | Realistic % | Why |
|------|-------------|-----|
| **Frontend (vendor + admin + customer web)** | **~56–66%** | Rich screens and flows; admin **tabs** for Contenu / Analytique; many paths depend on config; Electron vs web split; duplicated patterns across apps. |
| **Backend / APIs** | **~60–70%** | Phase A: root duplicate route trees largely **re-export** canonical handlers; **awaited** rate limits + subscription rules. Admin **`/api/admin/*`** surface expanded (zones, catalog, promos, analytics live, export). Residual: `apps/*` API overlap, money-path tests, iterative admin CSRF/role consistency. |
| **Infrastructure (observability, queues, idempotency)** | **~48–56%** | Structured **money-path** logs + optional Sentry on webhook failures; queues documented; webhook **DLQ** and order-payment idempotency still future work. |
| **Production readiness** | **~48–58%** | Guest guard + env story; API + auth e2e smoke; **payment/refund e2e** and **broad observability** still thin. |
| **Overall** | **~53–61%** | Phase A closed on **platform integrity** bar; admin feature phases improve **ops** coverage but do not substitute money-path QA or enterprise hardening for a broad launch. |

---

## Critical Blockers

**Mitigated (keep monitoring):**

1. ~~**Rate limiting**~~ — `applyRateLimit` is **async**; call sites **await**; **Upstash** used for standard presets when configured. *Residual risk:* custom `RateLimitConfig` values that do not match preset numerics still use in-memory only; add CI grep/eslint if regressions appear.

2. ~~**Subscription GET auto-create; STARTER without Stripe**~~ — GET does **not** auto-provision; STARTER in prod requires **`ALLOW_STARTER_PLAN_WITHOUT_STRIPE=1`** (or development). *Residual:* operators must set env correctly.

3. ~~**Guest orders on serverless**~~ — Vercel blocked unless explicit opt-in env; errors are **503** with clear message. *Residual:* still **file-backed**; DB migration is a separate project.

4. ~~**Root `app/api` duplicate trees**~~ — Addressed for the **legacy nested** paths targeted in Phase A (re-exports to canonical). **`apps/*` workspace copies** are not fully deduplicated.

**Still open (High / Critical for broad launch):**

5. **Vendor staff “permissions”** — Still **client-only**; [VENDOR_STAFF_PERMISSIONS.md](VENDOR_STAFF_PERMISSIONS.md) documents the model. Server RBAC for sub-roles **Phase B+**.

6. **Automated tests** — Payment tests largely **`test.skip`**; no end-to-end **money** path; **`api-smoke` + `auth.spec.ts`** cover public API + login only.

7. ~~**Docs sprawl**~~ — **Mitigated:** [CHANGELOG](../CHANGELOG.md), [ARCHITECTURE_SNAPSHOT.md](ARCHITECTURE_SNAPSHOT.md), [LEGACY_ROOT_STATUS_MARKDOWN.md](LEGACY_ROOT_STATUS_MARKDOWN.md); misleading `FINAL_*`/`COMPLETE_*` **not deleted** — see disclaimer doc.

---

## Feature-by-Feature Audit Table

| Feature | Expected behavior | Current implementation | Gap | Severity | Fix direction | Effort |
|--------|--------------------|------------------------|-----|----------|---------------|--------|
| **User roles (CUSTOMER/VENDOR/DRIVER/ADMIN)** | Enforced in session + APIs | `auth.config` + many routes check `session.user.role` | Staff sub-roles in vendor app are **UI-only**; not in DB | **High** | Add server-side staff/vendor user model or JWT claims; enforce on APIs | L |
| **Customer workflow (browse → checkout)** | Real orders and payments | Order creation, `createOrderInternal`, notifications | Dev fallbacks in `app/api/orders/create` for invalid payloads (dev only) | **Low** (dev) / verify prod | Ensure prod never uses demo paths; integration tests | S |
| **Vendor workflow (POS, ERP tabs)** | Works web + Electron | Large vendor app, shared components | Online vs offline consistency uncertain; not fully proven by tests | **Medium** | E2E for one vertical + smoke for POS | M |
| **Admin workflow** | User moderation, ads, subs, analytics, zones, promos | Routes under `app/api/admin/*` (root + `apps/admin`); UI tabs for ops | Relies on correct admin session; **many** mutating routes use CSRF + **normalized** `ADMIN` role checks on newer paths; **not** proven uniform across historical routes | **Medium** | Finish Phase 0–style sweep: every `POST/PATCH/DELETE` admin route | M |
| **Subscription system** | Stripe + DB sync | `lib/api-subscriptions.ts` + webhooks | **Improved:** GET no auto-create; STARTER gated by env in prod | **Medium** (ops) | Monitor `ALLOW_STARTER_PLAN_WITHOUT_STRIPE`; unit tests for handlers | S |
| **Passkey generation (subscription passkeys)** | Admin generates token for vendor | `app/api/admin/subscription-passkeys` hashes and stores in DB | **Improved:** rate limit errors no longer swallowed | **Low** | — | — |
| **WebAuthn / passkeys (security)** | Feature-flagged, admin moderation | `lib/webauthn/*`, tests present | Must enable env; OK pattern | **Low–Medium** | Ops checklist for envs | S |
| **Payment flow (Stripe)** | Intents, webhooks, consistent state | Webhook handler for subscription events | **Order** payment path needs separate verification; skipped tests | **High** | End-to-end tests; webhook idempotency for payments | M |
| **Order lifecycle** | Status transitions, notifications | `OrderStatus` + `orders/[id]/status` | Notification model is **DB records**; real-time depends on client polling/SSE | **Medium** | Define SLA for “notification”; push if required | M |
| **Registration approval** | Admin approve/reject | `registration-requests` + user creation in transaction | Looks coherent | **Medium** | E2E + email delivery verification | S |
| **AuthN / AuthZ** | NextAuth, approved users | Credentials + passkey + optional Google | `NEXTAUTH_SECRET` dev fallback (documented) | **High** if prod misconfigured | Enforce secret in CI/CD | S |
| **Notifications** | Users actually notified | `prisma.notification.create` + SSE route exists | **No evidence of email/SMS/push for all event types** in one path | **Medium** | Productize channel per notification type | M |
| **Inventory (ERP)** | Stock tied to real sales | `InventoryProduct`, API routes, tests for some inventory | Synchronization with `Product` (catalog) may be separate | **Medium** | Document and test cross-system sync | M |
| **Analytics / reports** | Accurate aggregations | Admin **`GET /api/admin/analytics`**, **`GET /api/admin/analytics/live`**, **`POST /api/admin/export`** (CSV/JSON); `demand-prediction` separate | **`demand-prediction`** weather/events still optional/neutral until APIs exist | **Low** | Either remove or integrate | S |
| **Refund / cancel** | Safe money handling | `refunds/create`, schema for `Refund` | Refund is **request**; Stripe refund automation not verified in this pass | **High** | Wire Stripe refund + idempotency | M |
| **Error recovery** | Idempotent webhooks, retries | Stripe webhook has basic handling | **No visible queue-based recovery** for all failures | **High** | Outbox or queue + DLQ | L |
| **Inventory alerts** | Email when low stock | `inventoryAlertsChecker` + `sendEmail` | **SMS/push** explicitly “would require additional services” | **Low–Medium** | As needed | S–M |
| **Guest / QR restaurant orders** | Durable, multi-device | **Local JSON** + **503** on Vercel unless opt-in | Storage still not multi-tenant DB; **deployment guard** in place | **High** (until DB) | Postgres-backed guest orders or Electron-only | M |

**Severity key:** Critical / High / Medium / Low — **Effort:** S = small, M = medium, L = large ( Engineering time, not hours ).

---

## Developer Claims vs Reality

| Claim pattern (from repo) | Reality check |
|---------------------------|---------------|
| “Production ready” / “Complete” in many root `*.md` files | **Overstated** relative to test depth, deployment-model issues, and rate-limit/Redis behavior. |
| `apps/vendor/docs/VENDOR_APP_PRODUCTION_READINESS.md` says pilots OK, not mass market | **Aligned** with findings—this doc is more honest than many others. |
| Monorepo “migration complete” style docs | **Partially** addressed for some **nested API** routes (re-exports to canonical). Full monorepo dedup **not** done. |
| Git messages like `...`, `update`, `fix` | **Poor traceability** for auditors/investors; no substitute for release notes. |

---

## Immediate Priority Roadmap

1. ~~**`applyRateLimit` / Redis**~~ — Done: `async` + `await` + Upstash mapping for standard presets. *(See [Post-audit implementation](#post-audit-implementation-same-release-window).)*
2. ~~**Subscription GET / STARTER**~~ — Done: no auto-create on GET; STARTER gated in production.
3. ~~**Duplicate root `app/api/**` trees (Phase A scope)**~~ — **Done:** canonical + re-exports for the legacy nested surfaces listed in [Post-audit implementation](#post-audit-implementation-same-release-window). **`apps/*`:** track as needed; not a Phase A gate.
4. ~~**Guest/dine-in on serverless**~~ — Done: **503** on Vercel unless `GUEST_ORDERS_ALLOW_ON_VERCEL=1`. **Postgres storage** optional follow-up (Phase B/C).
5. **E2E (Phase A bar)** — **Met:** `tests-e2e/api-smoke.spec.ts` + **`tests-e2e/auth.spec.ts`**. **Beyond Phase A:** registration → order → payment (mock) + admin mutation path.
6. **Staff permissions** — **Documented** in [VENDOR_STAFF_PERMISSIONS.md](VENDOR_STAFF_PERMISSIONS.md); **session guards** in `lib/server/session-guards.ts`. **Staff sub-role DB model + enforcement** — Phase B+.

---

## Enhancement plan

*Structured delivery work to close audit gaps and raise product quality. Product/admin feature backlog lives in* [**ADMIN_ENHANCEMENTS.md**](../ADMIN_ENHANCEMENTS.md) *(Phase 0 there matches platform work below).*

### Phase A — Platform integrity (**complete**, 2026-04-27)

Phase A aimed at **defensible routing, abuse controls, billing integrity hooks, and a minimal automated baseline** — not full product QA or enterprise launch.

| Work item | Outcome |
|-----------|---------|
| **Rate limiting** | **Done** — async `applyRateLimit`; **CI:** [`ci.yml`](.github/workflows/ci.yml) + [`pr-check.yml`](.github/workflows/pr-check.yml) run `npm run check:rate-limit`; Jest: `__tests__/api/lib/rate-limit-apply.test.ts`. Local bundle: **`npm run verify:phase-a`**. |
| **Subscriptions** | **Done** — no GET auto-create; `ALLOW_STARTER_PLAN_WITHOUT_STRIPE` + `ENV_TEMPLATE`; `__tests__/api/lib/api-subscriptions.test.ts`. |
| **Canonical APIs (root)** | **Done for Phase A targets** — legacy nested `delivery/`, `driver/`, `erp/`, `vendors/`, **`drivers/`** (incl. accept), **`auth`** (electron-login, check-status) resolved via canonical handlers + re-exports; **new routes** must not fork duplicate trees without `@deprecated`. *Follow-up:* `apps/*` duplicated `app/api` (Phase B backlog if needed). |
| **Guest / dine-in** | **Done at Phase A bar** — Vercel **503** unless `GUEST_ORDERS_ALLOW_ON_VERCEL=1`; **Postgres** guest store is **Phase B/C** when product requires cloud multi-device guest. |
| **Money paths** | **Phase A done for subscription Stripe events** — `ProcessedStripeWebhookEvent` idempotency + `__tests__/api/webhooks/stripe-idempotency.test.ts`. **Order payments, refunds, DLQ — Phase B**. |
| **Staff / vendor RBAC** | **Phase A scope** — `lib/server/session-guards.ts` for platform roles; **`VENDOR_STAFF_PERMISSIONS`** doc. **Cashier/manager DB + API enforcement — Phase B+.** |

**Verification:** `npm run verify:phase-a` (rate-limit script + TypeScript + Phase A Jest bundle).

### Phase B — Product hardening (**complete**, 2026-04-28)

| Work item | Outcome |
|-----------|---------|
| **Notifications** | **[NOTIFICATION_CHANNELS.md](NOTIFICATION_CHANNELS.md)** — channels (in-app, SSE, SMTP/Twilio); SLA expectations for paid tiers. |
| **Observability** | **`lib/observability/money-path-log.ts`** — JSON `money_path_v1` logs on Stripe webhook (`app/api/webhooks/stripe/route.ts`); **`captureMoneyPathException`** → Sentry when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` set. **`npm run verify:phase-b`** exercises the helper. *Follow-up:* dashboards/alerts on webhook 5xx rate — ops. |
| **Queues / background work** | **[BACKGROUND_JOBS_AND_REDIS.md](BACKGROUND_JOBS_AND_REDIS.md)** — `REDIS_HOST` / BullMQ in `lib/cache.ts`, worker expectations; Stripe remains sync in the route (no DLQ yet). **ENV_TEMPLATE:** `REDIS_HOST` / `REDIS_PORT` commented. |
| **Schema vs catalog** | **[ERP_CATALOG_VS_STOREFRONT_PRODUCT.md](ERP_CATALOG_VS_STOREFRONT_PRODUCT.md)** — `Product` vs `InventoryProduct`; sync guidance. |
| **Admin surface** | **CSRF** on mutating admin routes that previously lacked it: `ads`, `ads/[id]`, `export`, `subscriptions`, `subscriptions/[id]`, `users` POST, `users/[id]/reset-password` (passkeys route already had guard). Full audit of every `app/api/admin/*` route remains iterative. |

**Verification:** `npm run verify:phase-b`.

### Phase C — Excellence (**complete**, 2026-04-28)

| Work item | Outcome |
|-----------|---------|
| **Docs sprawl** | Root **[CHANGELOG.md](../CHANGELOG.md)**; **[ARCHITECTURE_SNAPSHOT.md](ARCHITECTURE_SNAPSHOT.md)**; legacy `FINAL_*` / `COMPLETE_*` disclaimers in **[LEGACY_ROOT_STATUS_MARKDOWN.md](LEGACY_ROOT_STATUS_MARKDOWN.md)** (files not deleted — bookmarks preserved). |
| **Demand prediction** | **`predictionMeta`** object on **`GET /api/analytics/demand-prediction`** (methodology + disclaimer); **`lib/services/demand-prediction.ts`** TODOs removed — weather/events neutral until APIs exist. |
| **E2E expansion** | **`tests-e2e/phase-c-boundaries.spec.ts`** (e.g. analytics route 401 without session). **`npm run verify:phase-c`** = Phase B + this Playwright file. |

Further journey tests (full money path, driver assignment) remain **product backlog**, not phase gates.

### Admin product phases ([ADMIN_ENHANCEMENTS.md](../ADMIN_ENHANCEMENTS.md) checklist **1–5** — documented complete 2026-04)

This is **product/admin delivery** layered on Phases A–C; it does **not** replace platform audit gates (money-path tests, webhook DLQ, staff RBAC).

| Theme | What shipped (repository) |
|-------|---------------------------|
| Users & moderation | Filters, bulk, suspend/unsuspend, reset password, etc. (`ADMIN_ENHANCEMENTS` Phase 1) |
| Vendor / driver ops | Stores, vendor stats, driver overview, manual assign-driver (Phase 2) |
| Orders & finance | Manual orders, order PATCH, refunds, financial summary (Phase 3); **payouts** explicitly **backlog** |
| Content & system | Zones, catalog categories, promos, broadcast notifications, **`GET`** system/config (Phase 4); root **`app/api/admin/`** parity |
| Analytics & reports | **`GET /api/admin/analytics`**, **`GET /api/admin/analytics/live`**, **`POST /api/admin/export`**; UI **Analytique** tab (Phase 5) |
| Remaining gaps (see enhancements doc) | Full **registration → order → payment** e2e; **every** mutating admin route CSRF + role policy; optional AuditLog depth |

---


## Enforcement plan

*How the organization **prevents regression** and **proves** fixes stay in place — not a one-time cleanup.*

### 1. Pull requests & code review (mandatory gates)

- **Block merge** on: `npm run type-check` (or workspace equivalent), `npm test` (Jest) with no new `test.skip` on payment/checkout/order without an explicit `// reason + ticket` comment.
- **Checklist** on PRs touching `app/api/**`: rate limit awaited; `auth()` + role check; no new duplicate route tree without deprecation plan.
- **Admin/mutating routes**: reviewer confirms CSRF and admin role policy (`ADMIN` / `session.user.role` checks, including case-normalized patterns where used) for `POST/PUT/PATCH/DELETE`.

### 2. CI / automation

- **Regression bundles:** **`npm run verify:phase-a`**; **`npm run verify:phase-b`**; **`npm run verify:phase-c`** (includes Phase C Playwright slice).
- Run **Jest** on every push to default branch; **Playwright** covers public API smoke + login (`tests-e2e/`).
- **Optional:** ESLint rule for un-awaited `applyRateLimit` if grep noise is reduced.
- **Environment:** production deploy **fails** or warns if `NEXTAUTH_SECRET`, `DATABASE_URL`, and (if billing on) `STRIPE_SECRET_KEY` / webhook secret are missing — match [ENV_TEMPLATE.md](../ENV_TEMPLATE.md) or project standard.

### 3. Runtime & production enforcement

- **Rate limits:** document that **Upstash** is required in production for accurate limits at scale; in-memory fallback documented as *best-effort only* on serverless.
- **Webhooks:** verify Stripe signature; log event id; safe retries; monitor **4xx/5xx** and duplicate processing.
- **Access:** `/api/debug/env` already restricted in production; keep **admin-only**; no new debug routes without same pattern.

### 4. Product & process

- **Release notes** per deploy (replaces unclear git messages for stakeholders).
- **Quarterly** mini-audit: duplicate API list, `test.skip` count, new env vars, subscription rules unchanged without approval.
- **Owner sign-off** before “broad launch”: checklist derived from **Critical blockers**; keep **`npm run verify:phase-c`** green when touching platform, webhooks, or admin routes.

### 5. What “done” means for an audit item

| Item | Enforcement signal |
|------|----------------------|
| Rate limits | Jest: `__tests__/api/lib/rate-limit-apply.test.ts` + **ongoing** review that new routes `await applyRateLimit` |
| Subscriptions | `__tests__/api/lib/api-subscriptions.test.ts`; env: prod policy for `ALLOW_STARTER_PLAN_WITHOUT_STRIPE` |
| Duplicate APIs | Re-exports in place for **migrated** paths; periodic grep for new nested duplicates |
| Guest orders | Vercel: **no** `GUEST_ORDERS_ALLOW_ON_VERCEL` until DB-backed; or desktop-only product story |
| Money | E2E or contract tests green; monitoring dashboard for payment errors |

---

## Final Verdict

**Phases A–C (platform integrity, product hardening, documentation & boundaries)** are reflected in **[CHANGELOG.md](../CHANGELOG.md)** and this audit. **`ADMIN_ENHANCEMENTS`** phases **1–5** improve **operator-facing** coverage only. Phases are **engineering governance** milestones, not a guarantee of unrestricted mass-market launch — see verdict below.

**Verification:** `npm run verify:phase-c` runs **`verify:phase-b`** plus **`tests-e2e/phase-c-boundaries.spec.ts`**.

**Can this go live now?**

- **As a small controlled pilot (known vendors, known hosts, admin oversight, no reliance on guest JSON on cloud):** you can **soft-launch** with **eyes open** and a **short, explicit** risk list and monitoring.

- **As a broad, self-serve, multi-tenant production launch with financial and reputational risk:** **Still no** — **money-path e2e**, **webhook/queue hardening**, **server-side staff authz**, and **full API deduplication** remain gaps even after this remediation.

**What would break in real production?** (Updated) **Wrong env** (e.g. `ALLOW_STARTER_PLAN_WITHOUT_STRIPE` left on) could still open abuse; **remaining duplicate URLs** if clients call unmigrated paths; **guest file storage** if someone forces `GUEST_ORDERS_ALLOW_ON_VERCEL` without a real DB. Rate-limit bypass via **unawaited** calls should be **largely gone** if code review holds.

**What is still dangerous?** **Money-adjacent** flows without e2e tests; **assumption** that all duplicate routes are re-exported; **multi-user vendor staff** without server RBAC.

---

*External systems (e.g. Linear, Jira, email threads) were not in scope; cross-check contractual claims there if needed.*
