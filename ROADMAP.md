# Albaz Delivery Pre-Production Roadmap

## Goals
- Launch restaurant delivery across customer, vendor/POS, driver, and admin apps with reliable checkout, fulfillment, and payouts.
- Harden quality, security, and observability to reduce launch risk.
- Enable early growth levers (promos, referrals, lifecycle messaging) without compromising stability.

## Now (Weeks 1-2) — Launch-Blocking Must-Haves
- **Customer**
  - Stripe checkout with 3DS/SCA, decline handling, and retry surface.
  - Address validation + delivery-area enforcement; clear ETA and live status.
  - Promo/coupon support; reorder from history; AA accessibility pass on home/catalog/checkout.
- **Vendor/POS**
  - Menu + availability scheduling; stockout rules and order throttling/pause.
  - Prep-time SLA controls; printer/invoice with tax breakdowns.
  - Payout ledger view; disputes intake; staff roles/permissions.
  - Offline-safe POS queue with sync status for electron runtime.
- **Driver**
  - Shift/availability toggle; assignment/batching rules (at least single + simple batching).
  - Navigation deep links; proof-of-delivery (photo + PIN); COD handling path.
  - Earnings breakdown with adjustments; safety/escalation quick actions.
- **Admin/Ops**
  - Global order command center (reassign, cancel/comp, refund).
  - SLA monitoring (prep/delivery), fraud/risk flags, manual review queue.
  - Vendor onboarding/KYC; fee/tax rules per region; payout reconciliation and disputes.
- **Platform Reliability/Security**
  - BullMQ workers for webhooks/order state; Redis/Upstash cache for catalog/config.
  - Idempotency + retries for payments/webhooks; rate limits on auth/payment/order APIs.
  - RBAC enforcement per app; audit logging for sensitive actions; secrets parity with `.env.production`.
- **Observability/Ops**
  - Sentry + Replay across apps; structured logs with request IDs.
  - Core metrics: checkout success/fail, payment decline reasons, assignment time, SLA breaches, queue depth/latency.
  - Healthchecks + synthetic probes (login, checkout, assign-driver).
- **Quality/Testing**
  - Unit/integration on auth redirects, promos/fees/tax, inventory/stockout, prep-time logic, payout math, assignment/batching, refund/comp rules.
  - Playwright happy-path + failure-path suites per persona; seed data for stable runs.
  - CI gates: per-app lint/type-check, unit/integration, targeted E2E smoke.

## Next (Weeks 3-4) — Hardening and Growth Enablers
- **Customer**
  - Ratings/reviews with moderation; featured vendors/collections.
  - Referral codes; push/email lifecycle (order updates, abandoned cart).
  - Loyalty points/stamps; richer search/filters/upsells.
- **Vendor/POS**
  - AI recommendations for bundles/stock; low-stock alerts.
  - Cost/COGS tracking; exports (CSV/XLSX); multi-location support.
- **Driver**
  - Heatmaps/bonus zones; scheduled shifts; richer drop-off instructions.
- **Admin/Ops**
  - Experiment flags for promos/fees; marketing placements and cohorts.
  - Expanded analytics (cohorts, retention, funnel, SLA by vendor/region).
- **Platform Reliability/Security**
  - Circuit breakers around partner APIs; backpressure on order intake when vendors paused/capacity exceeded.
  - PII minimization + Prisma field encryption; GDPR delete/export-my-data flow.
  - Dependency pinning + SAST (CodeQL/npm audit) in CI.
- **Observability/Ops**
  - Dashboards for queue depth, latency, SLA, payment declines, assignment lag.
  - Alerting + on-call runbooks; log sampling/retention policies.
- **Quality/Testing**
  - Load testing on checkout/order creation/assignment; chaos drills on queue/Redis/Stripe webhook retries.
  - Accessibility sweep beyond checkout (vendor POS, driver active delivery, admin dashboards).

## Later (Post-Launch) — Growth & Optimization
- Loyalty expansions (tiers/benefits), subscriptions, and scheduled orders.
- Dynamic pricing/fees by zone/time; marketing budgets per vendor.
- Advanced batching/route optimization; driver incentives modeling.
- Microfrontends or split deployments for independent scaling if needed.

## Success Metrics (early targets)
- Checkout success rate ≥ 97% (card) with tracked decline reasons.
- Assignment time p50 < 60s, p95 < 180s; SLA breach rate trending down.
- App crash rate < 1% sessions; Sentry issue MTTA < 30m.
- On-time payouts with reconciliation discrepancies < 0.5%.
