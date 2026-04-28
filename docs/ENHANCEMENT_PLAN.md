# Enhancement Plan — Production Readiness Roadmap

**Role:** Senior Product Architect, Technical Delivery Strategist, Production Readiness Consultant  
**Basis:** Findings in [TECHNICAL_PROJECT_AUDIT.md](./TECHNICAL_PROJECT_AUDIT.md) (Phases A–C closed; broad-launch gaps explicit)  
**Last updated:** 2026-04-28  
**Implementation status (2026-04-28):** Phases 1–3 are **implemented in code** with `npm run verify:phase-3`. **Phase 4 (leftovers closure)** adds: inventory **MANAGER vs CASHIER** enforcement (`assertVendorMayMutateInventoryCatalog`), seeded vendor staff users, admin **ops metrics** (`GET /api/admin/ops/metrics`), **account anonymize** (`POST /api/user/account/anonymize`), notification **channel plan logging** on order create, **admin/webauthn** root mirrors, CI scripts (`verify-admin-csrf`, `verify-api-parity`, `verify-money-no-test-skip`), `npm run verify:phase-4`, and policy backlogs (`docs/GUEST_ORDERS_POLICY.md`, `docs/SECURITY_PROGRAM.md`, `docs/POSTGRES_RLS_BACKLOG.md`, `docs/PAYOUT_PROVIDER_BACKLOG.md`).  

**Not claimable as “100% audit complete”:** Full money journey E2E with Stripe Checkout in CI, Postgres RLS, Stripe Connect payouts, and formal pen-test execution remain **program / infrastructure** work outside this diff.

---

**Historical notes**

Phase 1 items from the table below were **partially delivered** earlier: order payment webhook handling, refund execution + idempotency key, `VendorStaffMember` + wired vendor APIs, checkout/create-intent fixes, payment tests, deploy-env script, `npm run verify:phase-1`.

## Executive Summary

The platform has **real depth** (Next.js 16 monorepo, Prisma/Postgres, multi-role apps, subscription and admin surfaces, partial hardening). Audit truth: **quality is not uniform**—enterprise-shaped UI/schema sit beside **file-backed guest flows**, **client-only vendor staff “permissions”**, **money paths weakly tested**, and **webhook/error recovery** that is not yet investor-grade for high-volume money movement.

**Strategic posture:** Treat the product as **pilot-viable with a written risk register**, not **self-serve mass-market production** until money-path verification, server-side RBAC for staff, durable guest storage (or an intentional Electron-only SKU), and operational observability **prove** reliability under failure and replay.

**North star for this plan:** Move from “soft launch with eyes open” to “launch where money, access control, and data durability are **defended by tests, idempotency, and monitoring**, not by optimism or markdown.”

---

## Phase-Based Enhancement Roadmap

### Phase 1 — Critical Stabilization (Immediate)

Must-fix launch blockers for **any** expansion beyond a controlled pilot.

| Task | Problem | Why it matters | Recommended solution | Priority | Effort | Business impact |
|------|---------|----------------|---------------------|----------|--------|------------------|
| **Order payment path: tests + idempotency** | Order Stripe flow called out as needing verification; subscription webhook idempotency exists; **order** payments/refunds not at the same bar. | Double charges, stuck states, and reconciliation nightmares directly hit revenue and trust. | Define canonical order-payment state machine; add **ProcessedWebhookEvent** (or equivalent) for **payment intent / charge** events affecting orders; integration tests against Stripe test mode + fixtures; **no merge** without covering happy path + duplicate delivery. | Critical | M | Prevents the most expensive post-launch failures. |
| **Refund path: Stripe + idempotency** | Refunds modeled as requests; automation “not verified” in audit. | Regulatory, chargeback, and customer-service risk; manual work at scale. | Implement/refactor `refunds/create` to call Stripe with **idempotency keys**; persist refund attempt records; handle partial refunds; tests for failure/retry. | Critical | M | Makes cancellations and disputes operationally sane. |
| **Remove/justify every `test.skip` on money** | Payment/checkout tests largely skipped. | Skips are **silent acceptance** of unverified money behavior. | CI policy: `test.skip` on payment/order/checkout requires ticket + expiry; milestone to **zero skips** on money modules. | Critical | S–M | Turns “we think it works” into enforced proof. |
| **E2E: registration → order → pay (mock/real test env)** | Only API smoke + auth E2E today. | No story-level proof of the core product. | One Playwright journey per **primary** SKU (e.g. customer web): register or login → catalog → checkout → **Stripe test** completion; optional parallel **admin approve** if required by flow. | High | M | Investor- and ops-readable proof of the main line. |
| **Vendor staff RBAC on server** | Sub-roles are **UI-only**; not in DB / not API-enforced. | Any staff session can become a **privilege escalation** if APIs trust vendor session alone. | Model staff membership + roles in DB; pass claims in session/JWT; **`lib/server/session-guards`** (or equivalent) enforce on **every** vendor mutating route (POS, orders, refunds, inventory, settings). Start with **highest blast radius** routes. | Critical | L | Required for multi-user vendors and any serious B2B story. |
| **Guest / QR orders: product decision + implementation** | Local JSON + Vercel guard; enabling cloud without DB is dangerous. | Data loss, inconsistent multi-device behavior, support hell. | **Either:** Postgres-backed `GuestOrder` (tenant, session, TTL) + migration + tests; **or:** **document and enforce** “guest/QR only on Electron / dedicated host,” never flip `GUEST_ORDERS_ALLOW_ON_VERCEL` without DB. | Critical | M (DB path) | Aligns delivery model with reality. |
| **Admin mutating routes: CSRF + role sweep** | Newer routes improved; **not proven uniform** across all historical admin APIs. | CSRF and confused-deputy issues on powerful actions. | Inventory every `POST/PATCH/DELETE` under `app/api/admin/**` (and `apps/admin` mirrors); checklist + codemod pattern; one PR per domain if needed. | High | M | Closes the highest-impact authz holes in operations. |
| **Production secrets & flags** | `NEXTAUTH_SECRET` dev fallback; `ALLOW_STARTER_PLAN_WITHOUT_STRIPE` misuse risk. | Session compromise; free-tier abuse. | CI/CD: fail build/deploy if required secrets missing in prod; prod default **off** for starter-without-Stripe; runbook documents **exact** env matrix per environment. | Critical | S | Cheap insurance against catastrophic misconfig. |

---

### Phase 2 — Production Hardening

Reliability, operations, and **truth in production**—what runs when things break at 2 a.m.

| Task | Problem | Why it matters | Recommended solution | Priority | Effort | Business impact |
|------|---------|----------------|---------------------|----------|--------|------------------|
| **Webhook + async failure: queue + DLQ** | No queue-based recovery for all failures; Stripe still sync in route per docs. | Transient DB/Stripe/network errors → lost side effects or manual repair. | Outbox pattern or BullMQ (already documented in repo) for webhook side effects; **DLQ** + replay tool + alerting on DLQ depth. | High | L | Sustainable operations under load and partial outages. |
| **Observability: SLOs and dashboards** | Money-path logging + optional Sentry started; dashboards/alerts called follow-up. | You cannot run a marketplace without **seeing** payment and webhook health. | Dashboards: webhook success rate, latency, duplicate events, refund failures, queue depth; **paging** on thresholds; tie log correlation IDs to `orderId` / `paymentIntentId`. | High | M | Faster MTTR; credible ops story for investors. |
| **Notifications: channel matrix + SLA** | In-app/SSE exist; email/SMS/push not proven for all event types. | Users miss order updates; dispute volume rises. | [NOTIFICATION_CHANNELS.md](./NOTIFICATION_CHANNELS.md)-style matrix: per event type → channel → provider → fallback; measure delivery or explicit “degraded mode.” | Medium | M | Matches customer expectations for a delivery product. |
| **Duplicate API trees under `apps/*`** | Root re-exports done; workspace duplicates remain. | Drift, double fixes, wrong client base URL in prod. | Single source of truth: shared route modules or proxy; deprecation timeline; grep/CI for new forks. | High | L | Reduces regression and support cost. |
| **Inventory vs storefront catalog** | `Product` vs `InventoryProduct` sync is a known ambiguity. | Oversell, wrong availability, ERP vs POS inconsistency. | Document [ERP_CATALOG_VS_STOREFRONT_PRODUCT.md](./ERP_CATALOG_VS_STOREFRONT_PRODUCT.md) behavior in code paths; tests for sync boundaries; alerts on negative stock if allowed. | Medium | M | Protects operational credibility with vendors. |
| **Rate limiting: production posture** | Custom rate-limit configs may fall back to in-memory. | Abuse and unfair load distribution on serverless. | Prod checklist: **Upstash** (or equivalent) mandatory; CI lint/grep for risky patterns; document fallback as **non-production**. | Medium | S | Abuse resistance at scale. |
| **Documentation hygiene** | Many “100% / COMPLETE” docs vs ~53–61% audit reality. | Owners and investors make **wrong capital decisions**. | Single “source of truth”: CHANGELOG + ARCHITECTURE_SNAPSHOT + audit; legacy disclaimers; **no new** completion claims without linked tests/metrics. | Medium | S | Reduces governance and trust risk. |
| **Vendor vertical E2E** | POS/ERP not fully proven by tests. | Regressions in the main money-making app. | One E2E slice: login → POS sale → inventory decrement (or known mock). | Medium | M | Catches vendor-side breakage before release. |

---

### Phase 3 — Scalability & Enterprise Readiness

Long-term architecture for **multi-tenant scale**, compliance posture, and **enterprise sales**.

| Task | Problem | Why it matters | Recommended solution | Priority | Effort | Business impact |
|------|---------|----------------|---------------------|----------|--------|------------------|
| **Payouts + finance completeness** | Payouts explicitly backlog in admin enhancements. | Cannot close the loop with vendors at scale. | Design payout provider, ledger, reconciliation exports; separate from “admin can see revenue.” | High | L | Unblocks real marketplace economics. |
| **Audit log depth (admin + money)** | AuditLog “optional depth” in backlog. | Disputes and investigations need tamper-evident trails. | Append-only audit for admin mutations, refunds, role changes, payout actions; retention policy. | Medium | L | Enterprise and compliance conversations. |
| **Real-time strategy** | Notifications rely heavily on polling/SSE. | Scale and UX limits for drivers and live ops. | Product decision: WebSocket service, managed pub/sub, or staged polling with SLAs; cost model. | Medium | L | Predictable behavior at peak lunch rush. |
| **Security program** | Passkeys/WebAuthn OK with correct env; broad surface. | B2B buyers ask for **process**, not only features. | Periodic pen test scope; dependency audit in CI; secrets scanning; RLS review on Postgres if multi-tenant isolation tightens. | Medium | M–L | De-risks enterprise procurement. |
| **Deployment topology** | Electron + serverless + possible workers. | Complexity caps velocity and debuggability. | Reference architecture diagram: what runs where; worker processes; DB connection pooling (e.g. PgBouncer) before heavy scale. | Low–Medium | M | Avoids scale cliffs. |
| **Data residency / GDPR hooks** | Large platform footprint implies future obligations. | Legal exposure when expanding regions. | Export/delete procedures, DPA checklist, subprocessors list—aligned to actual providers (Stripe, email, Sentry). | Low (until EU) | M | Positions for geographic expansion. |

---

## Technical Governance Plan

**Prevent regressions**—aligned with the audit’s enforcement section, tightened for execution.

### CI/CD rules

- **Required on every PR touching `app/api/**`:** `type-check`, full Jest suite, **`verify:phase-c`** (or successor bundle), and **no new** `test.skip` on payment/order/checkout without `// REASON: TICKET-XXX` and removal date.
- **Optional but recommended:** grep/ESLint for unawaited `applyRateLimit`; fail on new duplicate route trees without `@deprecated` + removal issue.
- **Deployment:** Block or hard-warn when `DATABASE_URL`, `NEXTAUTH_SECRET`, and (if billing enabled) Stripe secrets missing; **prod must not** ship with `ALLOW_STARTER_PLAN_WITHOUT_STRIPE=1` unless exec sign-off documented.

### Pull request quality gates

- **API PR template:** auth + role check path named; rate limit awaited; idempotency key for money mutations; link to E2E or unit tests.
- **Admin PRs:** reviewer explicitly checks CSRF + normalized `ADMIN` role on every mutating handler in the diff.
- **Two-person rule** for webhook and refund logic changes (author + reviewer familiar with Stripe idempotency).

### Deployment safety checks

- **Pre-deploy:** migration dry-run; smoke Stripe webhook in staging; verify worker/Redis if queues enabled.
- **Post-deploy:** synthetic transaction in test mode; dashboard for webhook 5xx; rollback playbook with **feature flags** for risky paths (guest cloud, experimental payment modes).

### Security enforcement

- Periodic **dependency** and **secret** scans; lock down debug routes in prod; WebAuthn/feature flags documented per env.
- **Staff RBAC** tests must fail if a “cashier” session can hit manager-only APIs.

### Testing policy

- **Pyramid:** unit (idempotency, guards), integration (Stripe test API), E2E (one golden path per major app).
- **Definition of Done** for money features: automated proof + monitoring metric or log contract.

### Release management

- **Human-readable release notes** per deploy—not raw git subjects.
- **Quarterly mini-audit:** duplicate route list, `test.skip` count, new env vars, subscription rule changes, guest-order storage mode.

---

## Owner Visibility Framework

### Weekly reporting model

One page, fixed sections (no slides full of UI screenshots as “progress”):

1. **Risks:** open Critical/High items with **owner** and **target week**.
2. **Proof:** links to CI runs, test coverage deltas, **E2E recording** or report artifacts.
3. **Money path:** webhook error rate, refunds processed vs failed, queue/DLQ depth (when live).
4. **Scope creep:** new features vs Phase 1 completion—**explicit tradeoff**.

### Delivery proof system

- **Green CI** on the verify bundle is necessary but **not sufficient**.
- **Acceptable proof:** merged tests + staging runbook execution + metric/log capture for the changed path.
- **Not acceptable:** markdown claiming “complete” without test/observability references (per audit).

### Anti-fake-progress rules

- **Ban “100%”** language unless tied to a **published checklist** with objective criteria (e.g. “all admin POST routes have CSRF + role test”).
- **Feature done** = code + tests + monitoring hook + runbook note (where operational).
- **Doc updates** that only rephrase status count as **zero** story points unless they fix incorrect claims.

### Verification checkpoints

| Checkpoint | Gate |
|------------|------|
| **P1 exit** | Money-path tests unskipped; order webhook idempotency; refunds idempotent; staff RBAC on HIGH blast-radius vendor APIs; guest strategy **implemented or legally constrained**; admin CSRF/role sweep complete for mutating routes. |
| **P2 exit** | Queue/DLQ or equivalent for webhook side effects; dashboards + alerts live; notification matrix implemented for P0 events; `apps/*` API dedup plan executed or time-boxed with explicit debt. |
| **P3 exit (target)** | Payout ledger + reconciliation exports in product or ops; **audited** admin money actions; DSAR export + written erasure process; real-time strategy chosen for scale drivers; dependency/supply-chain hygiene (Dependabot or equivalent); deployment topology documented. |
| **P4 (leftovers closure)** | CI: admin CSRF lint, admin/root API parity (`apps/admin` vs `app/api`), no `test.skip` in money test dirs; vendor inventory **manager** gate; ops metrics JSON; self-service anonymize; policy docs for guest orders, security program, RLS + payout automation backlog; `npm run verify:phase-4`. |
| **Production launch** | Final go-live checklist below **all true**. |

---

## Final Go-Live Checklist

Before calling the system **full production-ready** (self-serve, multi-tenant, money-moving), **all** should be true:

1. **Payments:** Order and subscription flows covered by automated tests; Stripe webhooks **idempotent** for all handled event types affecting money; documented replay procedure for failures.
2. **Refunds:** Stripe-backed, idempotent, **audited**; support runbook for partial/refund-on-cancel edge cases.
3. **Access:** Server-enforced **vendor staff** roles on all mutating vendor APIs; admin mutating routes uniformly **CSRF + role** checked.
4. **Data:** Guest/QR orders **durable and tenant-safe** on chosen deployment model, or **explicitly unavailable** on cloud (no “JSON + hope”).
5. **Operations:** Dashboards and alerts for webhooks, payments, queues; on-call path defined; `NEXTAUTH_SECRET` and Stripe secrets **verified** in prod.
6. **E2E:** At least one **end-to-end money journey** green in CI/staging on a schedule.
7. **API surface:** No unmanaged duplicate route trees; clients documented against **canonical** paths.
8. **Documentation:** STATUS reflects audit-style honesty; release notes and env matrix current; no reliance on legacy “FINAL/COMPLETE” files as evidence.
9. **Legal/Ops:** Refund/dispute policy matches system behavior; subprocessors and notification providers listed accurately.

---

## Bottom line

Phases A–C raised the **floor** (rate limits, subscription GET rules, guest guardrails, root API re-exports, partial observability). **This plan** is what converts “impressive codebase” into **defensible production**—by binding money, permissions, and durability to **tests, idempotency, and ops visibility**, not to documentation tone or UI completeness.

---

*External PM tools and private tickets were not in scope; align checkpoints with your issue tracker as needed.*
