# Vendor app POS vs `apps/pos`: what to reuse

*2026-11-01. Compares the existing vendor app (`apps/vendor`, Next.js + Electron) with the new POS (`apps/pos`), to copy what is worth keeping instead of rebuilding it.*

## Summary

The vendor app already covers a lot of ground, but its foundations are the ones the spec (§0) says to replace:
- prices trusted from the screen;
- floats for money;
- the database password on the PC;
- sync without idempotency;
- reports computed in the browser.

So **reuse its product knowledge and UI ideas, not its sale, sync or storage code.** The new `apps/pos` already enforces the money rules (server-side pricing, integer DZD, one transaction per sale, idempotent sales, audited overrides). What it lacks is breadth, and that's where the vendor app helps.

## Feature by feature

| Area | Vendor app | `apps/pos` today | Decision |
|---|---|---|---|
| Sale API | `lib/api-handlers/erp/sales.ts`: **price, subtotal, total sent by the screen**, floats; only checks `total = subtotal − discount` | Prices from the database, `pos-core` totals, integer DZD, idempotent | **Do not copy.** Same class of bug as spec §0.2 |
| Offline storage & sync | `electron/offline-db.js` + `sync-service.js`: SQLite cache, POSTs without idempotency, **`DATABASE_URL` in `vendor-config.json` next to the .exe** | SQLite is the source of truth, outbox with event ids, no DB credentials | **Do not copy.** Spec §0.2, §0.3 |
| Scanner (USB keyboard wedge) | `hooks/useBarcodeScanner.ts`: detects bursts of keys **anywhere on the screen** (≥4 chars, <80 ms apart) | Only the focused scan field | **Copy** (ported now) |
| Scanner (camera) | BarcodeDetector + `@zxing/browser` fallback | — | **Later.** Useful for shops without a scanner; adds a dependency |
| Excel import | `InventoryTab.tsx`: column names from real shop files (*Désignation, Code, PA, PV, Qté, Seuil…*), **imports opening stock**; parses in the renderer, no zip guard, "2.500" → 2.5 | Hardened reader (zip-bomb guard, limits, whole dinars), per-row errors, all-or-nothing | **Copy the column vocabulary and the opening-stock column** (ported now), keep our parser |
| Cart | `usePOSCart`: categories grid, numeric keypad, coupons, % tax, **custom "divers" item** | Scan/search, line and sale discounts | **Later:** category tiles and a keypad for touch screens; "divers" needs a schema decision (a non-catalog line) |
| Coupons | `CouponsTab`, `applyCoupon` (floats, client-side) | — | **Later**, as server-side promotions (spec "Should have") |
| Receipt / invoice | `ReceiptDialog`; `InvoiceView` A4 *facture* with HT/TVA — **TVA hard-coded at 20 %** (Algeria: 19 %, 9 % reduced) | Thermal receipt (raster, Arabic) | **Later:** reuse the A4 invoice layout when formal invoices are needed; fix the rate and add NIF/NIS/RC |
| Reports | `ReportsTab`: sales, products, customers, financial; date range; print — **computed in the browser from loaded sales** | Z-report per shift only | **Copy the report types and layout** into a Reports page, computed with SQL in the main process (next slice) |
| Stock | `InventoryTab` edit + `InventoryAlertsTab` (low stock, expiry rules, alert history) | Low-stock threshold per variant; no Stock page yet | **Copy the low-stock list idea**; the Stock page (receive, adjust, count) is the spec's Phase 6 |
| Staff roles | OWNER / **MANAGER** / CASHIER, permissions `sales.view`, `inventory.mutate`… (`lib/vendor-staff-access.ts`) | OWNER / CASHIER | **Copy the MANAGER role** later (needs a migration: the role CHECK is fixed) |
| Customers / suppliers | `CustomersTab`, `SuppliersTab` (ERPCustomer, Supplier) | — | **Later** (spec "Should have": customer credit book, suppliers) |
| Expenses | `vendor-accounting-local.ts` (amount, category, note) | Cash in/out with a reason | Covered for the drawer; full accounting is out of scope |
| Restaurant, kitchen, RFID, Dine-QR, drivers, domains, AI, email | many tabs | — | **Not for retail POS** (archived scope) |
| UI kit | shadcn + MUI + Tailwind | Plain React + CSS, RTL-first | **Do not copy components** (different stack); copy layouts and wording |

## Ported in this change

1. **Import column names** from the vendor importer (*Désignation, Libellé, Article, Code article, PA, PV, Prix unitaire, Coût unitaire, Qté, Quantité, Seuil, Famille…*).
2. **Opening stock column** (*Stock, Qté, Quantité*): imported products start with that stock, recorded as a RECEIVE stock movement by the signed-in user. Then stock is right from day one.
3. **Global scanner detection** on the Sell screen: a scan is added to the cart even when the cursor isn't in the scan field.

## Next, in order

1. **Reports page** (vendor `ReportsTab` layout): sales by day, top and bottom products, by category, by cashier, discounts, margin. SQL in main, CSV export.
2. **Stock page** (spec Phase 6): receive (supplier, cost), adjust or count with a reason, low-stock list from the vendor alerts idea.
3. **Touch selling:** category tiles and a keypad from `POSView`.
4. **MANAGER role** and the permission names from `vendor-staff-access.ts`.
5. **Camera scanning** (`@zxing/browser`), customers/suppliers, the A4 invoice with correct TVA: when pilots ask.
