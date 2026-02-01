## Vendor Web vs Electron Analysis

### Scope

This document compares the vendor web app and Electron app, summarizes gaps, and tracks implementation across Phase 1 (Security & Stability), Phase 2 (Performance & Maintainability), and Phase 3 (Offline Reliability).

---

## Architecture Overview

### Web App

- Next.js app with server routes under `app/api/*`.
- Auth and access control via NextAuth + JWT.
- Vendor dashboard under `app/vendor/page.tsx`.
- Data loading utilities in `utils/dataUtils.ts` and `hooks/useDataLoading.ts`.

### Electron App

- Next.js renderer at `apps/vendor`.
- Electron main process in `apps/vendor/electron/main.js`.
- Offline SQLite via `better-sqlite3` in `apps/vendor/electron/offline-db.js`.
- Sync service in `apps/vendor/electron/sync-service.js`.
- Electron preload bridge in `apps/vendor/electron/preload.js`.

---

## Feature Parity (High-Level)

| Area | Web | Electron | Notes |
|---|---|---|---|
| POS | ✅ | ✅ | Electron supports offline sales via SQLite/localStorage. |
| Inventory | ✅ | ✅ | Electron has offline inventory and sync queue. |
| Orders | ✅ | ✅ | Electron queues order status changes offline. |
| Customers | ✅ | ✅ | Electron has offline customers table. |
| Analytics | ✅ | ✅ | Audited on admin routes. |
| Offline Mode | ⚠️ | ✅ | Web has offline queues; Electron has SQLite + sync. |
| Audit Logging | ✅ | ✅ | Added across sensitive routes. |
| Device-bound auth | ⚠️ | ✅ | Electron deviceId binding enforced. |

---

## Key Gaps (Before Implementation)

- Missing `/api/auth/electron-login` endpoint.
- Monolithic vendor dashboard components and heavy initial loads.
- Offline sync lacked idempotency, conflict handling, and UI visibility.
- Inconsistent audit logging across sensitive operations.

---

## Phase 1: Security & Stability (Implemented)

- Electron login hardened: `/api/auth/electron-login` added with audit logging and header enforcement.
- Device-bound tokens (deviceId header + JWT claim validation).
- Audit logging added across inventory, sales, orders, admin actions, and exports.
- Auth helpers improved to validate Electron device binding.

---

## Phase 2: Performance & Maintainability (Implemented)

- Staged data loading: core data on load; tab-specific fetches on demand.
- Per-tab loading indicators and skeleton UI.
- Vendor dashboard modularized:
  - `VendorDataTabs`, `VendorOpsTabs`, `VendorPosTab`
- Electron code splitting for tabs via lazy loading.

---

## Phase 3: Offline Reliability (Implemented)

### Idempotency

- Every sale generates an idempotency key.
- `/api/erp/sales` enforces idempotency (root + vendor app).
- Electron replay sends `x-idempotency-key`.
- Electron offline DB stores `idempotencyKey` for sales.

### Conflict Handling

- Sync conflicts (409) are tracked with `lastError: CONFLICT`.
- Conflicted items remain visible and can be removed manually.
- Electron sync skips items with conflict errors until resolved.

### Queue Observability + Retry

- Electron diagnostics show pending sync items, errors, attempts.
- Manual retry and item removal in Electron diagnostics.
- Web settings show queue counts + recent error summaries.

### Offline Coverage

- Web offline queues: sales, order status updates, inventory create/update/delete.
- Automatic sync when online across all three queues.

---

## Success Metrics

- Auth integrity: 0 logins via dev fallback in production.
- Performance: FCP < 2.5s on mid-tier devices.
- Reliability: < 1% offline sync conflicts per week.
- Supportability: 50% fewer vendor-facing error reports.

---

## Subscription Tiers (Draft)

### Basic

- Includes: POS, Inventory (up to 50 products), Dashboard (basic sales summary).
- Excludes: Low-stock alerts, advanced analytics, multi-terminal, offline sync tools.

### Standard

- Includes: POS, Inventory (up to 250 products), Low-stock alerts, Dashboard + sales analytics, Customers & loyalty, Suppliers.
- Limits: Up to 5 terminals per site.

### Pro

- Includes: Everything in Standard, plus offline sync tools (Electron), advanced analytics, audit logs, role-based staff access.
- Limits: Up to 20 terminals per site.
- Multi-location: **Pro only** (site-level inventories).

---

## Acceptance Criteria (Examples)

### Electron Auth Hardening

- `/api/auth/electron-login` returns a signed token + vendor payload.
- Dev fallback disabled in packaged builds.
- Electron login fails with invalid credentials; no local bypass.

### Offline Idempotency

- Every sale includes an idempotency key.
- Server returns the existing sale on duplicate submission.
- Offline retries do not duplicate sales.

### Offline Queue UX

- Vendors can see pending items + errors.
- Conflicts are visible and can be removed after review.
- Retry is available from the UI.

---

## Open Questions

- Should Electron allow multi-vendor login on one device? **No.**
- Is inventory isolated per vendor or shared across locations? **Isolated per vendor/site.** Multi-screen access is per site (subscription-based) and inventory is tied to that site.
- Expected scale (max SKUs, daily orders, concurrent terminals)?

---

## Suggested Next Steps

1. Run Prisma migration for `Sale.idempotencyKey` on target environments.
2. Add optional “queue details” view for the web app (full list, filters).
3. Add a conflict resolution modal to inspect and edit queued payloads.
4. Track sync stats (conflictCount, lastSyncAt) in analytics.
