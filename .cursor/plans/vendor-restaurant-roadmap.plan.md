---
name: Vendor Restaurant roadmap
overview: Extend the restaurant-only vendor build with QR table ordering, restaurant-specific feature flags (hide label printing), accounting, and a backlog of high-value F&B features—on top of the existing flavor + lock-vertical packaging approach.
todos:
  - id: vertical-lock
    content: Ship bundled-flavor lock (write-bundled-flavor.js, main.js IPC, login skip) as baseline for Restaurant-only behavior
    status: completed
  - id: feature-flags
    content: Introduce shopType or build-flavor driven feature flags (tabs, settings, print APIs) to hide label printing and tune POS for restaurant
    status: completed
  - id: qr-ordering-mvp
    content: Design and implement QR→public menu→cart→submit order→vendor KDS/order inbox (API + persistence + realtime or poll)
    status: completed
  - id: accounting-mvp
    content: Define accounting scope (ledger, day close, COGS) and implement MVP reports + exports in vendor restaurant build
    status: completed
  - id: ci-vendor-typecheck
    content: Add npm script type-check:vendor and run it in CI + pr-check workflows
    status: completed
  - id: untrack-electron-dist
    content: Stop tracking apps/vendor/dist (git rm --cached); keep dist/asar out of repo
    status: completed
  - id: kitchen-kds-mvp
    content: Restaurant Kitchen tab (4-column KDS board) behind kitchenBoard feature flag
    status: completed
  - id: kds-stations-timers
    content: KDS phase 2 — prep stations, bump/recall, ticket timers, optional sound per column
    status: completed
  - id: public-menu-86-sync
    content: 86 / out-of-stock — sync POS to public QR menu in near-realtime
    status: completed
  - id: desktop-flavors-pipeline
    content: One codebase multi-flavor — all-verticals script, root npm aliases, CI workflow_dispatch + restaurant default on push
    status: completed
isProject: false
---

# Vendor Restaurant — product roadmap (plan iteration)

This document **extends** the earlier “locked vertical + same codebase” approach: restaurant installers use the existing flavor pipeline (`[electron-builder.flavor-restaurant.yml](apps/vendor/electron-builder.flavor-restaurant.yml)`, `VENDOR_BUILD_FLAVOR=restaurant`, `bundled-flavor.json`) plus **explicit lock + feature flags** so the app is restaurant-first and can diverge safely from retail/grocery.

---

## 1. QR code ordering (table → guest menu → vendor)

**Goal:** Each table has a QR. Guest scans → **read-only menu** (no vendor login) → cart → confirm → order appears in the **vendor restaurant** app (POS / kitchen / orders tab).

**Suggested architecture (high level):**


| Layer                 | Responsibility                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public menu**       | Lightweight web page (same monorepo or dedicated route): `GET /menu/:storeSlug` or `?table=12` — no Electron. Mobile-friendly.                                       |
| **Identity in QR**    | Encode `storeId` (or slug) + `tableId` / `tableCode` in URL; optionally signed token (HMAC/JWT) to prevent URL tampering.                                            |
| **Submit order**      | `POST` API creates a **pending** order with `source: qr_table`, `tableId`, line items, notes; returns confirmation to guest.                                         |
| **Vendor visibility** | Vendor app lists “incoming” orders (filter `source === qr_table`), sound/badge, merge or convert to POS ticket if needed.                                            |
| **Realtime**          | Prefer **SSE** or **WebSocket** from existing Next server if available; else **short polling** on orders list for MVP.                                               |
| **Offline**           | Restaurant desktop is offline-capable today: decide policy — “QR ordering requires cloud” (simplest) or queue on a small **edge** service; document clearly for MVP. |


**Vendor UI (incremental):**

- **Floor / tables:** CRUD tables, assign QR (download PNG or print sheet).
- **Order inbox:** New sub-view or tab section: table label, time, items, **Accept / reject / bump**.
- **Kitchen display (optional phase 2):** Same data, kitchen-oriented layout.

**Security / abuse:**

- Rate limit submit by IP + table token.
- Optional **PIN on bill** or **staff confirm** before kitchen fires (phase 2).

---

## 2. Remove or hide features (example: label printing)

**Approach:** Central **feature flags** keyed by `shopType === 'restaurant'` (and/or `bundled-flavor.lockShopType`) so one codebase stays maintainable.

**Label printing:** Today printing is wired via Electron APIs and settings (e.g. `[utils/printerSettings.ts](apps/vendor/utils/printerSettings.ts)`, `printProductLabels` in `[lib/electron-api.d.ts](apps/vendor/lib/electron-api.d.ts)`). For restaurant:

- Hide **label printer** settings and any **“print product labels”** entry points in UI.
- Optionally no-op IPC with a clear error only if something calls it (defense in depth).

**Other candidates to hide or simplify for restaurant** (validate with you before cutting):

- **RFID** (if retail-oriented).
- **Suppliers** tab depth (keep light “vendor orders” vs full retail supplier workflow).
- **Drivers** if dine-in-only (keep if you also deliver).

Use `[config/shopTypes.ts](apps/vendor/config/shopTypes.ts)` tab lists and/or a small `features.ts` map: `restaurant: { labels: false, rfid: false, ... }`.

---

## 3. Accounting features (restaurant-oriented)

Scope in **phases** to avoid a vague “accounting module.”

**MVP (high value, bounded):**

- **Z-report / X-report style day close:** per register / per day — gross sales, refunds, tax buckets, payment methods (cash/card), tips.
- **Expense ledger:** simple lines (category, amount, date, note), not full double-entry at first.
- **Export:** CSV + PDF for accountant; same filters as reports.

**Phase 2:**

- **Chart of accounts** light: revenue, COGS, payroll hooks.
- **Inventory valuation** tied to purchases (link to suppliers / invoices if data exists).
- **Multi-register** if you have more than one POS station.

**Integration note:** If you already sync to a cloud backend, define whether accounting is **local-only** (Electron SQLite) vs **synced** — affects conflict handling and audits.

---

## 4. More features to consider (suggestions)

Prioritize by **dine-in revenue** and **kitchen throughput**:

1. **Kitchen Display System (KDS)** — tickets by station (grill, cold), bump, recall, timers.
2. **Course firing** — starter/main/dessert; hold & fire on waiter action.
3. **Split bill / seat billing** — optional with table QR flow.
4. **Reservations** — calendar, walk-in list, no-show tracking.
5. **Waiter handheld mode** — web or slim app: take orders at table (same backend as QR).
6. **Modifier / allergen** workflow — mandatory modifiers, kitchen alerts.
7. **86 / out-of-stock** — sync from POS to public menu in near-realtime.
8. **Loyalty / visit frequency** — simple stamps or points for dine-in.
9. **Tip pooling** — configurable rules for payroll exports.
10. **Multi-language menu** — public menu FR/AR toggle (you already use bilingual patterns elsewhere).

---

## 5. Implementation sequencing (recommended)

1. **Vertical lock + flags foundation** — `lockShopType` in `bundled-flavor.json`, IPC + login skip, then `features[shopType]` for UI/API surface.
2. **QR MVP** — public menu + submit API + vendor order inbox (cloud-first if that matches current sync).
3. **Accounting MVP** — day close + expenses + export.
4. **KDS / courses** — builds on stable order pipeline.

**Done in repo (engineering):**

- `npm run type-check:vendor` at monorepo root; GitHub Actions `ci.yml` and `pr-check.yml` run it after Prisma generate.
- Electron build output under `apps/vendor/dist` is removed from version control (regenerate locally with `npm run electron:build` in `apps/vendor`).
- **Cuisine (KDS)** tab for `shopType === restaurant` (`kitchenBoard` in `apps/vendor/config/vendorFeatures.ts`): large-ticket four columns (Nouveau → Acceptées → En préparation → Prêtes), same status actions as Commandes.
- **KDS phase 2** (`KitchenTab` + `apps/vendor/lib/kitchen-kds-preferences.ts`, `kitchen-kds-sounds.ts`): configurable **prep stations** (line-item station tags + filter), **Bump** hides ready tickets locally (session) with **Recall** stack, **timers** per ticket (warn after N minutes in current step), **per-column entry chimes** (toggleable).
- **86 / QR menu sync**: `guest-menu-product-state.json` (hidden IDs) + SQLite `stock > 0` for `GET /api/guest/menu/products` (no-store + guest page poll ~6s). Vendor **Menu QR (86)** column on Inventaire toggles `PATCH .../guest-menu/product-state`. Submit order validates stock + hidden.
- **Desktop flavors (one codebase)**: `apps/vendor/scripts/electron-build-all-flavors.js` builds restaurant → retail → grocery sequentially; `electron:build:win:other` for generic vertical; root scripts `build:vendor:desktop:`*. GitHub `build.yml`: push to `main` builds **restaurant** only; **workflow_dispatch** can pick a flavor or **all**. `verify-build.js` resolves expected `.exe` from `bundled-flavor.json`.

---

## 6. Open decisions (capture when you implement)

- **Hosting:** Public menu on same Next app (route groups) vs subdomain.
- **Auth for QR submit:** Anonymous + table token vs minimal phone OTP.
- **Order model:** Reuse existing `Order` type/DB tables vs new `GuestTableOrder` entity — impacts migrations and POS merge logic.

When you are ready for **implementation** (code changes), say explicitly to execute (e.g. “implement this plan”); until then this file is the living product/tech spec for iterations.