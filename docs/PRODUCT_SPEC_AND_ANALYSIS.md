# AL-baz POS — Product & Technical Analysis and MVP Specification

*Version 2 · 2026-10-31. Rewritten after the owner's decisions: **general-retail POS + stock**, **Windows PC (Electron)**, **simple receipts only**, **no real users in production yet**, **one pilot city, no vendors committed yet**. The marketplace/delivery analysis (v1) is superseded.*

**Tags used below**
- **[FACT]** — verified in the repo or a cited source.
- **[ASSUMPTION]** — my inference; please confirm it.
- **[REC]** — my recommendation.
- **[DECIDED]** — your answer.

---

## 0. Blockers found in the current code (fix before building on it)

### 0.1 Production secrets in a public repository — CRITICAL (lower impact now, still mandatory)
- **[FACT]** `.env.production` has been tracked in git since 2025-10-23. It contains `DATABASE_URL`, `POSTGRES_URL`, `PRISMA_DATABASE_URL`, `NEXTAUTH_SECRET` and `VERCEL_OIDC_TOKEN`; I read key names only. The repo `hamza11-max/albazdelivery` is publicly readable.
- **Impact:** you said there is only test data, so the data leak itself is small. But anyone can still use that database (write to it, delete it, run up its cost). They can also forge logins as long as that secret stays in use.
- **Fix:**
  1. Rotate the DB password and `NEXTAUTH_SECRET`.
  2. Make the repo private or purge the file from history.
  3. Stop tracking the file and add it to `.gitignore`.
  4. Add secret scanning to CI.
- **[REC]** Because there are no real users, the simplest fix is to **create a brand-new database** for the POS and abandon the old one.

### 0.2 The desktop app is designed to hold the master database password — CRITICAL for a POS
- **[FACT]** `apps/vendor/electron-builder.yml` ships `vendor-config.json` next to the `.exe`.
- **[FACT]** `electron/main.js:748-753` reads `DATABASE_URL` from that file and passes it to the embedded Next.js server, which then talks to cloud Postgres directly.
- **Impact:** every shop PC would hold credentials for the **shared** database of all shops. Any shop owner, cashier, or anyone who copies the PC's files could read or delete every other shop's sales and stock.
- **[REC] Rule for the new design:** the desktop app **never** sees a database credential. It talks to a cloud HTTPS API using a **per-device token**, and the server enforces which shop that device belongs to.

### 0.3 Offline sync can duplicate sales and has no tenant identity — HIGH
- **[FACT]** `electron/sync-service.js` POSTs each pending sale to `/api/erp/sales` with no idempotency key and no device or auth header.
- **Impact:** if the response is lost (common on weak connections), the sale is retried and **counted twice** in the cloud. Updates are sent as last-write-wins `PUT`s with no version check.
- **[REC]** Sync must be idempotent by client-generated IDs (see §6.4).

### 0.4 Other things to carry over as rules
- **Money is `Float` everywhere** in the Prisma schema (42 fields, zero `Decimal`). **[REC]** Use integer DZD.
- **Marketplace pricing bugs** (customer-set prices in `POST /api/orders`, client-chosen currency in `create-intent`, no order state machine) are no longer on the critical path, because that code gets archived. **Do not ship it** to any public URL in the meantime.

---

## 1. Understanding the product

### 1.1 One-sentence definition
> A simple, Arabic/French, offline-first point-of-sale and stock app for small Algerian retail shops on a Windows PC, with automatic cloud backup and a phone view for the owner.

### 1.2 Description
The cashier scans or searches an item and the app adds it to the sale. It takes cash, works out the change and prints a receipt on an 80 mm thermal printer. Stock goes down automatically, and returns and exchanges are one click.

The owner gets:
- stock levels with low-stock alerts;
- a record of goods received;
- a daily cash closing (expected vs counted);
- sales reports.

All of it works **with no internet**. When a connection is available, data is backed up to the cloud. The owner can then see today's sales from their phone and restore everything onto a new PC if the old one dies.

### 1.3 Target users
| User | Who | Goal |
|---|---|---|
| **Shop owner** (buyer, primary) | small retail: clothing, shoes, phones & accessories, cosmetics, home goods; 1 shop, 1 till, 1–3 staff | know what sells, stop stock "leaking", stop cash disappearing, look professional |
| **Cashier** | family member or employee, often not tech-savvy | sell fast, few clicks, no mistakes |
| **Platform admin** (you) | | issue licences, take payments, support shops |

### 1.4 Problems → solution
| Problem today [ASSUMPTION — confirm with shop visits] | What the MVP does |
|---|---|
| Sales in a notebook or memory; no idea of real profit or best sellers | every sale recorded with cost price → margin report |
| Stock counted by eye; theft and loss go unnoticed | stock moves only through sales, receipts, returns and adjustments (with reason) |
| Cash in the drawer doesn't match | shift open/close with expected vs counted cash, discrepancies logged |
| Variants (size/colour) impossible to track on paper | product → variants, each with its own barcode and stock |
| PC dies → everything lost | automatic cloud backup + restore |
| Owner away from shop can't see anything | read-only phone dashboard |

- **Value proposition:** *"Know your stock and your cash, even without internet. Your data is safe if the PC breaks."*
- **Primary use cases:** sell, return/exchange, receive stock, close the day.
- **Secondary use cases:** print barcode labels, low-stock list, adjust stock after a count, view reports remotely.
- **Business goals:**
  - 10 pilot shops using it daily within 3 months of the first release;
  - 50 paying shops in the pilot city within 12 months;
  - monthly churn under 5%.

### 1.5 Challenges to your choices (honest)
1. **The market is crowded and cheap.**
   - [FACT] Algerian POS software already sells with monthly, yearly or perpetual licences, or bundled with hardware. One local product is advertised as free to start, then 20,000 DA/year ([ZoomAlgérie](https://zoomalgerie.com/logiciel-caisse-pos-algerie/)), and stock software is listed on Ouedkniss for around 9,500 DA one-off ([Ouedkniss](https://www.ouedkniss.com/applications-software-logiciel-gestion-de-stock-et-reparation-ouled-selama-blida-algeria-d35393499)). Cracked copies of foreign software are common [ASSUMPTION].
   - **You will not win on features.** You can win on: dead-simple Arabic UI, retail variants done right, cloud backup + owner phone view (most local tools are desktop-only), and local support.
   - **Price expectation:** probably 1,500–3,000 DA/month [ASSUMPTION].
2. **No vendors committed.** This is the biggest risk, larger than any technical one. **[REC]** Before Phase 4, visit 10–15 shops in the pilot city, show a clickable prototype, and get 5 to agree to a free pilot. Their answers decide the open questions in §16.
3. **"General retail" is broad.** Clothing (variants, exchanges) and phone shops (IMEI/serial numbers, repairs, warranties) behave differently. **[REC]** The MVP targets **clothing/shoes/accessories/cosmetics**: variants + barcodes + exchanges. Serial/IMEI tracking and repairs are post-MVP.
4. **Simple receipts only [DECIDED].** Fine for a pilot. Be aware that many shops will soon ask for proper *factures* with TVA and legal IDs (NIF, NIS, RC, AI) for business customers [ASSUMPTION — verify with an accountant]. Design the data so this can be added without migrations that break history: store tax rate per line as 0 for now.
5. **Arabic on thermal printers is hard.** Most cheap ESC/POS printers don't print Arabic text properly in text mode (wrong shaping, wrong direction) [FACT — known ESC/POS limitation]. **[REC]** Render the receipt as an **image** (HTML → bitmap) and print it as raster. This is a core technical decision; prototype it in week 1.
6. **One till per shop for the MVP [REC].**
   - Multi-till means two offline databases merging stock, which is the hardest problem in this whole product.
   - With one PC per shop, the **local database is the source of truth** and the cloud is a backup and read-only mirror, which removes almost all sync conflicts.
   - Multi-till comes later, with an explicit design.
7. **Customer order updates = tracking link only [DECIDED].** In a POS there is no delivery to track, so the MVP has **no customer notifications**. The only outbound messages are to the owner (optional low-stock / daily summary), and those go in-app or on the phone dashboard.
8. **What to drop from the current repo:** the marketplace, storefronts, custom domains, WhatsApp flows, drivers, delivery zones, wallet, loyalty, ads, reviews, chat, support tickets, passkeys, the restaurant and grocery Electron builds, Expo apps, duplicated `apps/*` APIs, and ~150 status `.md` files. Archive them on a branch.

---

## 2. Competitive / product analysis

| Expected (table stakes) | Differentiators worth having | Makes it complicated (avoid for now) |
|---|---|---|
| fast sale screen, barcode scan, cash + change, receipt print, stock levels, returns, daily report, users with PIN, Arabic + French | variants matrix (size × colour) with per-variant barcode and stock; one-click exchange; cash-closing with discrepancy history; cloud backup/restore; owner phone dashboard; barcode label printing; works fully offline; installs in 10 min | multi-shop/multi-till sync, accounting/ledger, formal invoices + TVA, supplier purchase orders & credit, loyalty, e-commerce sync, bank card terminal (TPE) integration, payroll, repair tickets |

- **Risks:**
  - local resellers bundle hardware + software + installation, and win on presence;
  - shops are used to a one-time payment, not a subscription;
  - piracy.
- **Opportunities:**
  - offer an optional hardware bundle (printer + scanner) through a local supplier;
  - offer an annual plan with a discount;
  - make the free tier limited (e.g. 200 products, no cloud) so it competes with cracked software.

---

## 3. Requirements

### Must have (MVP)

| ID | Feature | User | Trigger | Expected behaviour | Inputs → outputs | Depends | Edge cases |
|---|---|---|---|---|---|---|---|
| M1 | Install & activate | Owner | runs installer | Windows installer (signed); first run asks to sign in or create an account → registers this PC as the shop's device → downloads licence | email/phone + password → device token + licence | cloud API | no internet on first run → 14-day offline trial, activate later |
| M2 | Shop setup | Owner | first run wizard | shop name, phone, address, logo, receipt footer text, currency DZD, language, printer pick + test print | → Shop settings | M1 | printer not found → continue, set up later |
| M3 | Users & PIN | Owner | Settings | owner + cashiers, each with 4–6 digit PIN; role OWNER / CASHIER; quick user switch | → users | M2 | forgotten PIN → owner resets; forgotten owner PIN → reset via cloud account password |
| M4 | Products & variants | Owner | Products | product: name (ar/fr), category, brand, cost price, sale price, photo (optional); variants by up to 2 options (e.g. size, colour), each with SKU, barcode (scan existing or generate), price override, stock | → Product, Variant | M2 | duplicate barcode → blocked; delete with history → archive |
| M5 | Import products | Owner | Products → Import | CSV/Excel template; preview + per-row errors; nothing saved until confirmed | file → products | M4 | 5,000 rows; bad encoding (Arabic) → UTF-8 BOM template |
| M6 | Sale screen | Cashier | Sell | scan/search → line added; qty ±; line discount and sale discount (limit by role); total; **Cash** payment with amount tendered → change; complete → receipt prints; stock decreases in the same transaction | → Sale, SaleLines, StockMovements, receipt | M4 | unknown barcode → "add product?" (owner) / "not found" (cashier); out of stock → warning, allow (setting); printer error → sale still completes, reprint later |
| M7 | Payment methods | Cashier | Pay | Cash (MVP); "Card (external terminal)" recorded manually; split payment cash + card | | M6 | |
| M8 | Hold / recall sale | Cashier | Hold | park current cart, serve next customer, recall | | M6 | app closes while held → kept |
| M9 | Returns & exchanges | Cashier/Owner | scan receipt or search sale | select lines to return → refund cash or exchange for other items in one transaction; stock back in (or marked damaged) | → Return sale with negative lines | M6 | no receipt → owner-only, manual pick; return window setting (e.g. 7 days); partial returns; can't return more than sold |
| M10 | Receive stock | Owner | Stock → Receive | pick/scan items, qty, cost price; optional supplier name & reference | → StockMovements(RECEIVE) | M4 | new cost price → update product cost (weighted average or last cost — choose last cost for MVP) |
| M11 | Stock adjustment & count | Owner | Stock → Adjust | set counted qty or ± with reason (count, damage, theft, gift) | → StockMovements(ADJUST) | M4 | |
| M12 | Shift / cash closing | Cashier/Owner | open/close | open with starting float; close: counts cash, app shows expected, difference, saves Z-report and prints it; cash in/out during shift (e.g. pay a supplier from the drawer) with reason | → Shift | M6 | app crash mid-shift → shift stays open; forget to close → prompt next day |
| M13 | Reports | Owner | Reports | today/date range: sales, returns, net, margin, by category, top/bottom products, by cashier, discounts given; stock value; low stock list | → screens + CSV export | M6 | large ranges → aggregated queries |
| M14 | Barcode labels | Owner | Products → Print labels | choose variants & quantities → print on label printer or A4 sticker sheet (Code128/EAN-13) | → print job | M4 | |
| M15 | Receipt | system | sale complete | rendered as image: logo, shop, date/time, receipt no., cashier, lines, discount, total, paid, change, footer; reprint any receipt | | M6 | Arabic + French mixed; long names wrap |
| M16 | Audit log | system | sensitive action | voids, line deletions after scan, discounts over X%, returns, price edits, drawer opened without sale, stock adjustments, user changes → who/when/what | → AuditEvent | all | can't be deleted from UI |
| M17 | Cloud backup & restore | system/Owner | every few minutes when online | pushes new local events to the cloud (idempotent); status icon (synced / pending n / offline); "Restore to this PC" on a new install | | M1 | days offline → queue grows, then catches up; restore over existing data → explicit confirmation |
| M18 | Owner phone dashboard | Owner | opens web URL on phone | read-only: today's sales, last sync time, low stock, shift closings with discrepancies | | M17 | data only as fresh as the last sync — show "last updated" |
| M19 | Licence & plan | system/Admin | periodic check | signed licence valid 30 days offline; expiry → 7-day grace → **read-only mode** (can view, export, can't sell); never lock owners out of their own data | | M1 | PC clock rolled back → detect via last-seen timestamp |
| M20 | Local backup | system | daily + on close | copy of the SQLite file to a second folder / USB; keep 14 | | | disk full → warn |
| M21 | Auto-update | system | on start | signed updates; local DB migrations run with automatic backup first | | | migration fails → roll back to backup, keep old version |
| M22 | Admin console (web) | Admin | | shops list, devices, licence/plan, record manual payment (BaridiMob/CCP/cash), extend trial, deactivate device | | cloud | |
| M23 | i18n | all | | Arabic (RTL) + French, switchable per user | | | |

### Should have (next)
- Serial/IMEI tracking per unit (phone shops).
- Customer credit book (*crédit*): customer, balance, payments.
- Simple suppliers list + purchase history.
- Promotions (X% off a category for dates).
- Owner notifications (daily summary / low stock) on the phone dashboard as web push.
- Supplier credit.
- Weighted-average cost.
- Online plan payment (Chargily — CIB/Edahabia).

### Could have
- Formal *facture* with TVA and legal IDs.
- Multi-till in one shop.
- Multi-shop with stock transfers.
- Customer list + loyalty.
- Card-terminal integration.
- Repair tickets.
- E-commerce/storefront sync (the existing storefront code could return here).
- Android owner app.

### Won't have yet
Delivery, marketplace, drivers, WhatsApp ordering, accounting ledger, payroll, AI recommendations, RFID (exists in repo — drop), restaurant/grocery builds, passkeys.

---

## 4. User flows

### 4.1 First-time owner
```
Download installer → install (SmartScreen OK if code-signed)
→ First run: "Sign in / Create account"  ──offline──► 14-day local trial, banner "activate when online"
→ Create account (name, phone, email, password) → device registered → licence TRIAL 30 days
→ Wizard: shop info → language → printer (detect, test print) → create owner PIN
→ Add products: "Import from Excel" | "Add one" | "Scan to add"
→ Open first shift (float) → Sell screen
Failure: printer test fails → "Skip, set up later" (sales still recorded); import errors → row list, fix and retry
```

### 4.2 Returning cashier (daily)
App opens on the **PIN screen** → enter PIN → if no shift is open, "Open shift: starting cash?" → Sell screen → … → "Close shift" → count cash by denomination → app shows expected vs counted → if the difference is not 0, a reason is required → Z-report prints → logout.

### 4.3 Sale (core loop)
```
Scan / type / tap product
  ├─ found, 1 variant ──► line added (beep)
  ├─ found, many variants ──► variant picker (size × colour grid)
  └─ not found ──► owner: quick-add dialog | cashier: "Not found" + search
Adjust qty / discount (cashier discount capped by setting; above cap → owner PIN)
Pay → enter cash given (quick buttons 500/1000/2000/exact) → change shown
Complete → ONE local transaction: Sale + lines + payments + stock movements + receipt no.
  → print receipt (async) ──fail──► toast "Printer: no paper" + Reprint button; sale is already saved
  → drawer kick
Next sale (cart cleared, focus on scan field)
```

### 4.4 Return / exchange
Scan the receipt barcode (or search by date/amount) → original sale shown → pick lines and quantities to return → choose: refund cash, or exchange (add new items; the difference is paid or refunded) → reason (optional) → complete → return receipt prints.
- Without a receipt: owner PIN, then pick the product manually.

### 4.5 Receive stock
Stock → Receive → supplier (optional, free text) → scan items + qty + cost price → review totals → Confirm → stock goes up → optional "print labels for these items".

### 4.6 Authentication
- **Cloud account** (owner): email or phone + password. Used for activation, restore, the phone dashboard and resetting the owner PIN.
- **Local:** PIN per user. 5 wrong PINs → 1-minute lock.
- **Password reset:** by email link or SMS code (pick one provider) → new password → all devices' web sessions revoked (the device token stays valid).

### 4.7 CRUD (products)
- **List:** search, filter by category or stock status, sort.
- **Create/edit:** form with a variant grid (generate combinations from options).
- **Delete:** archive only if there is history, hard delete if never sold.
- **Bulk:** price change by % for a category (Should).
- **Empty state:** "No products yet" + Import / Add / Scan buttons.

### 4.8 Search/filter
Sale-screen search matches name (ar/fr), SKU and barcode, and returns results in under 100 ms locally with an FTS5 index. The sales list filters by date, cashier, payment method or amount; the stock list by category, low stock or zero stock.

### 4.9 Notifications (MVP)
In-app only:
- sync status;
- licence expiring;
- low stock badge;
- shift left open;
- printer offline;
- update ready.

Owner phone alerts are post-MVP.

### 4.10 Settings
Shop info, receipt layout (logo, footer, size 58/80 mm), printer and drawer, label printer, users & PINs, permissions (cashier discount cap, allow negative stock, return window), language, backup folder, sync status / force sync, licence/plan, about/update.

### 4.11 Errors, empty, loading, permissions
- **Errors:** never lose a sale. Every error explains the next step: "Printer not connected — sale saved. Reprint from History."
- **Empty states** exist on every list.
- **Loading:** local operations are instant, so spinners appear only for cloud actions (restore, activation).
- **Permission denied:** "Owner PIN required" dialog. The owner enters their PIN once and the action proceeds and is audited.

### 4.12 Account deletion
- **Cloud:** Web dashboard → Delete account → password → cloud data is deleted after a 30-day grace period. Before that, the app offers a full export (CSV + SQLite file).
- **Local:** "Remove data from this PC" in Settings, requires the owner PIN plus typing the shop name.

---

## 5. UX/UI

### 5.1 Navigation (desktop app, 1366×768 minimum, touch-friendly)
```
[PIN screen]
Left rail: Sell (home) · History · Products · Stock · Reports · Settings        Top bar: shift status · sync icon · user · language
Sell screen: [scan/search field always focused] [cart lines] | [totals · discount · Hold · Recall · PAY (big)]
```
The phone dashboard (web) has three tabs: Today · Stock alerts · Closings.

### 5.2 Screens

| Screen | Purpose | Main components | Primary CTA | Secondary | Validation / errors |
|---|---|---|---|---|---|
| PIN / user switch | fast login | user tiles, PIN pad | Unlock | change user | lockout after 5 tries |
| Sell | sell fast | scan field, cart table, variant picker modal, totals panel, quick product tiles (favourites) | **Pay (F12)** | Hold, Recall, discount, remove line, return | qty ≥ 1; discount caps; empty cart can't pay |
| Payment modal | take money | amount due, tendered input, quick-cash buttons, method toggle, change | **Complete (Enter)** | split, cancel | tendered ≥ due for cash |
| History | find sales | list with filters, sale detail | Reprint | Return/exchange, void (owner, same shift only) | |
| Return/exchange | refunds | original lines with returnable qty, new items panel, balance | **Complete** | | qty ≤ returnable; window rule |
| Products | catalog | table, search, filters, product drawer with variant grid | **Add product** | Import, Print labels, Archive | unique barcode/SKU; price > 0; cost ≥ 0 |
| Stock | stock ops | stock table, Receive, Adjust, Count | **Receive** | Adjust | reason required for adjust |
| Shift close | cash control | expected breakdown, denomination counter, difference | **Close & print** | cash in/out | reason if difference ≠ 0 |
| Reports | insight | date range, KPI tiles, tables, CSV | — | Export | |
| Settings | configure | grouped sections | Save | test print | |
| Admin web | operate business | shops, devices, licences, payments | Record payment | extend trial, revoke device | audited |

### 5.3 Usability rules
- **Keyboard first.** The scanner acts as a keyboard, and every main action has a shortcut (F-keys) shown on its button.
- **Touch.** Targets are at least 44 px, because many counters use touch screens [ASSUMPTION].
- **Numbers.** Large and Western digits (0-9) in both languages [ASSUMPTION — confirm with shops].
- **Feedback.** Sound and colour on scan success or failure, plus a text message (never colour alone).
- **Arabic layout.** RTL uses logical CSS properties; product names in mixed Arabic/French render correctly.
- **Contrast.** Meets WCAG AA. Every function works by keyboard, with visible focus.

---

## 6. Technical architecture

### 6.1 Options compared

| | A. Keep current: Electron + embedded Next.js server + SQLite + direct Postgres | **B. Electron + React (Vite) renderer + SQLite in main process + cloud sync API** | C. Browser PWA + IndexedDB |
|---|---|---|---|
| Security | ✗ DB credentials on every PC (§0.2) | ✓ device token only | ✓ |
| Offline | ✓ | ✓ | ~ (storage can be evicted) |
| Printing / drawer / scanner | ✓ | ✓ (native USB/serial, raster print) | ✗ weak, browser-dependent |
| Startup & weight | slow (boots a Next server, port 3001 conflicts) | fast | fastest |
| Reuse of existing code | most | UI components, `offline-db.js` ideas, barcode-scanner | some UI |
| AI-builder friendliness | low (two runtimes, IPC + HTTP + env) | good if IPC is typed | good |

**[REC] Option B.** Reuse React components from `apps/vendor`, but drop the embedded Next server and the direct Postgres connection.

### 6.2 Stack
| Layer | Choice | Why |
|---|---|---|
| Desktop shell | **Electron** (current LTS), `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer | matches decision; existing code |
| UI | React + TypeScript + Vite; Tailwind; i18next (ar/fr, RTL) | fast, simple, reuse components |
| Local DB | **SQLite via better-sqlite3** in the main process; WAL mode; FTS5 for search; a migration runner (e.g. versioned SQL files) | reliable, transactional, already used |
| Renderer ↔ DB | typed IPC API (`window.pos.sale.complete(...)`) with Zod validation in main | renderer never touches SQL |
| Domain logic | pure TS package `@albaz/pos-core` (cart totals, discounts, returns, stock, shift math) shared by desktop and cloud | testable, one source of truth |
| Printing | receipt HTML → offscreen render → bitmap → ESC/POS raster via USB/serial/network (or Windows printer driver fallback); drawer kick command | Arabic support (§1.5.5) |
| Scanner | keyboard wedge (no driver) + fast-input detection | existing `barcode-scanner.js` |
| Cloud API | **Next.js route handlers on Vercel** (root app, slimmed) | already in repo |
| Cloud DB | PostgreSQL (Neon, EU) + Prisma, **new clean schema** | |
| Auth | cloud: Auth.js credentials (owner web + admin); device: opaque token (random 32 bytes, hashed on the server) bound to shopId + deviceId; stored with Electron `safeStorage` (Windows DPAPI) | |
| Licence | Ed25519-signed JSON token (shopId, deviceId, plan, validUntil), verified offline with the public key embedded in the app | offline-safe |
| Updates | electron-updater + **code-signing certificate** (needed to avoid SmartScreen warnings; budget for it) | |
| Errors | Sentry (desktop main + renderer + cloud), with PII scrubbing | |
| Jobs | Vercel Cron: licence expiry emails, cleanup | no worker servers |

### 6.3 Diagram
```
┌──────────── Shop PC (Windows) ─────────────┐         ┌──────── Cloud (Vercel + Neon EU) ────────┐
│ Renderer (React)  ──IPC(typed)──►  Main     │  HTTPS  │ /api/device/activate  /api/sync/push     │
│  Sell, Stock…                     ├ pos-core│ ──────► │ /api/sync/snapshot   /api/licence        │
│                                   ├ SQLite  │ device  │ Owner dashboard (read-only, web)         │
│                                   ├ Printer │ token   │ Admin console                             │
│                                   └ Outbox ─┼────────►│ Postgres (per-shop rows, shopId scoped)   │
└─────────────────────────────────────────────┘         └───────────────────────────────────────────┘
```

### 6.4 Sync design (single till per shop)
- **Source of truth:** the local SQLite. The cloud is an append-only mirror plus a backup.
- **Outbox:** every local write transaction also inserts an `outbox` row: `{ eventId UUIDv7, entity, entityId, op, payload, createdAt, deviceSeq }`.
- **Push:** a batch of up to 200 rows → `POST /api/sync/push` with the device token.
  - The server upserts by `(shopId, eventId)`, so a retry never duplicates anything.
  - It returns the last accepted `deviceSeq`, and the client deletes those outbox rows (or marks them synced).
- **Entities synced:** products, variants, users (without PIN hashes), sales, returns, stock movements, shifts, audit events, settings.
- **Pull:** none in the MVP, apart from **restore** (`GET /api/sync/snapshot`, paged) on a new install and the licence refresh.
- **Device replacement:** activating a new device marks the old one inactive. Its pushes are rejected with `409 DEVICE_REPLACED`, and the old app shows "This shop now runs on another PC".
- **Future multi-till:** stock becomes a pure ledger (sum of movements) on the cloud; tills pull each other's movements. Prices and catalog get version numbers. Design it later; don't pre-build it.

---

## 7. Data model

**Conventions**
- **IDs:** UUIDv7 strings generated on the device, so they are unique offline.
- **Money:** `INTEGER` DZD (whole dinars; **[ASSUMPTION]** no centimes needed).
- **Quantities:** `INTEGER` (no weights in general retail).
- **Times:** stored in UTC, displayed in Africa/Algiers.
- **Shape:** the same logical schema locally (SQLite) and in the cloud (Postgres with an added `shopId` on every table).

| Entity | Key fields (type, required, default) | Constraints / indexes |
|---|---|---|
| **Shop** | id, name✓, phone, address, logoPath, receiptFooter, currency 'DZD', locale 'ar', settings JSON (discount caps, allowNegativeStock=true, returnWindowDays=7, receiptWidth=80) | cloud: ownerAccountId |
| **Device** (cloud) | id, shopId✓, name, tokenHash✓, status ACTIVE/REPLACED/REVOKED, appVersion, lastSeenAt, activatedAt | unique tokenHash; index shopId |
| **Account** (cloud) | id, email (unique, optional), phone (unique), passwordHash, role OWNER/ADMIN, sessionVersion Int 0, createdAt, deletedAt | |
| **Licence** (cloud) | shopId, plan TRIAL/BASIC/PRO, validUntil, status, notes | one per shop |
| **PlanPayment** (cloud) | id, shopId, amount Int, method CCP/BARIDIMOB/CASH/CARD, reference, periodStart, periodEnd, recordedBy | |
| **User** (local staff) | id, name✓, role OWNER/CASHIER, pinHash✓ (argon2id, local only), isActive true, createdAt | unique name per shop |
| **Category** | id, name✓, parentId?, sortOrder 0, archivedAt | |
| **Product** | id, name✓, nameAlt?, categoryId?, brand?, description?, imagePath?, costPrice Int 0, salePrice Int✓ (>0), trackStock true, option1Name?, option2Name?, archivedAt, version | FTS index on name/nameAlt/brand |
| **Variant** | id, productId✓, option1Value?, option2Value?, sku✓, barcode?, salePrice? (override), costPrice?, stockQty Int 0 (cached), lowStockThreshold?, archivedAt | unique sku; unique barcode (when not null); index productId |
| **StockMovement** (ledger, append-only) | id, variantId✓, type SALE/RETURN/RECEIVE/ADJUST/DAMAGE, qtyDelta Int✓ (≠0), unitCost?, refType? (sale/return/receipt/adjust), refId?, reason?, userId✓, createdAt | index (variantId, createdAt); `stockQty` updated in the same transaction |
| **StockReceipt** | id, supplierName?, reference?, note?, userId, createdAt, totalCost Int | lines via StockMovement(RECEIVE) |
| **Shift** | id, openedBy✓, openedAt✓, openingFloat Int✓, closedBy?, closedAt?, expectedCash Int?, countedCash Int?, difference Int?, differenceReason?, denominations JSON? | at most 1 open shift per device |
| **CashMovement** | id, shiftId✓, type IN/OUT, amount Int✓ >0, reason✓, userId, createdAt | |
| **Sale** | id, number✓ (e.g. `R-{deviceShort}-{seq}`), type SALE/RETURN, originalSaleId? (for returns), shiftId✓, userId✓, status COMPLETED/VOIDED, subtotal Int, discountTotal Int, taxTotal Int 0, total Int, paidTotal Int, changeGiven Int, note?, createdAt, voidedAt?, voidReason?, voidedBy? | unique number; index createdAt, shiftId |
| **SaleLine** | id, saleId✓, variantId✓, nameSnapshot✓, variantLabelSnapshot, qty Int✓ (negative on returns), unitPrice Int✓, unitCost Int✓ (snapshot), lineDiscount Int 0, taxRate Int 0, lineTotal Int✓ | index saleId, variantId |
| **Payment** | id, saleId✓, method CASH/CARD_EXTERNAL, amount Int✓ | |
| **HeldCart** | id, userId, payload JSON, createdAt | local only |
| **AuditEvent** (append-only) | id, userId?, action✓ (VOID_SALE, DELETE_LINE, DISCOUNT_OVER_CAP, PRICE_EDIT, DRAWER_NO_SALE, STOCK_ADJUST, RETURN_NO_RECEIPT, USER_CHANGE, SETTINGS_CHANGE, PIN_OVERRIDE), entity?, entityId?, before JSON?, after JSON?, createdAt | index createdAt |
| **Outbox** (local only) | eventId✓, entity, entityId, op, payload JSON, deviceSeq Int (autoincrement), syncedAt?, attempts 0, lastError? | index syncedAt |

### Relationships
- **One-to-many:**
  - Shop → Devices / Users / Products;
  - Product → Variants;
  - Variant → StockMovements;
  - Sale → SaleLines / Payments;
  - Shift → Sales / CashMovements.
- **Self-reference:** Sale (RETURN) → original Sale.
- **Many-to-many:** none in the MVP.
- **Soft delete:** archive for Product, Variant, Category, User.
- **Corrections:** sales are never deleted, only **voided** (same shift, owner PIN, audited) or **returned**. StockMovement and AuditEvent are append-only.
- **Ownership:** each cloud row carries `shopId`. All cloud queries go through `requireShop(deviceOrSession)`.

### Invariants (enforce in `pos-core` + DB constraints + tests)
- `Sale.total = Σ lineTotal − sale-level discount`. `paidTotal ≥ total` for cash, and `changeGiven = paidTotal − total`.
- `Variant.stockQty = Σ StockMovement.qtyDelta` for that variant. A rebuild command checks this.
- A return line's quantity can never exceed what was sold on the original sale minus what was already returned.
- Receipt numbers are strictly increasing per device, with no gaps except voids, which keep their number.

---

## 8. Authentication & authorization

| Capability | Owner | Cashier | Admin (cloud) |
|---|---|---|---|
| Sell, hold, recall, cash payment | ✓ | ✓ | – |
| Discount up to cap / above cap | ✓ / ✓ | ✓ / owner PIN | – |
| Return with receipt (within window) | ✓ | ✓ | – |
| Return without receipt / outside window | ✓ | owner PIN | – |
| Void sale (same shift) | ✓ | ✗ | – |
| Open drawer without sale | ✓ | owner PIN (audited) | – |
| Open/close own shift, cash in/out | ✓ | ✓ (cash out needs reason) | – |
| See expected cash before counting | ✓ | ✗ (blind count) | – |
| Products, prices, stock receive/adjust | ✓ | ✗ (view only) | – |
| Reports (margins, costs) | ✓ | ✗ (own shift summary only) | – |
| Users, settings, backup, restore | ✓ | ✗ | – |
| Phone dashboard | ✓ | ✗ | support view (audited) |
| Licences, devices, payments | ✗ | ✗ | ✓ |

- **Cloud accounts**
  - Owner: password hashed with argon2id.
  - Admin: seeded only, with TOTP 2FA (Should; required before the first paying shop).
  - Sessions: httpOnly cookies. Changing the password bumps `sessionVersion`, which logs out other sessions.
- **Device tokens**
  - Issued on activation and revocable from the admin console or the owner dashboard.
  - Every sync request is checked against `Device.status == ACTIVE`.
- **Local PINs**
  - Hashes stay on the PC and are never synced.
  - The owner PIN can be reset by signing in to the cloud account from the app.
- **Offline**
  - The licence token is verified locally. An expired licence gives read-only mode, never deletion or lock-out.

---

## 9. Security

| Risk | Protection |
|---|---|
| Secrets in repo (§0.1) | rotate, new DB, purge, gitleaks in CI, `.env*` ignored except `.env.example` |
| DB credentials on client (§0.2) | removed; device tokens only; server-side tenant checks |
| Stolen/copied shop PC | device token in DPAPI `safeStorage`; owner can revoke the device remotely; local DB holds only that shop's data. **Optional:** encrypt SQLite with SQLCipher (Should — adds complexity) |
| Cashier fraud (voids, deletes, discounts, no-sale drawer, fake returns) | role permissions, owner-PIN overrides, append-only audit log, blind cash count, "deleted after scan" lines recorded, discrepancy report |
| Tampering with local DB to fake numbers | accept the risk (owner owns the PC); the cloud keeps the event history as received; flag gaps in receipt numbers |
| Licence cracking | signed tokens make casual tampering pointless; accept that determined piracy happens; the value is in cloud backup + dashboard, which requires a valid account |
| Sync API abuse | per-device rate limits; payload size limits; Zod validation; reject entities from another shop; idempotency |
| Electron hardening | contextIsolation, sandbox, no `nodeIntegration`, strict CSP, no remote content in the main window, validate every IPC input, disable `webview`, open external links in the browser only |
| Update channel | code-signed builds; HTTPS update feed; signature verification (electron-updater) |
| Injection | SQLite: prepared statements only; Prisma on cloud; no raw string SQL |
| XSS in renderer | React escaping; product names never rendered as HTML (receipt template escapes too) |
| Imports | CSV/XLSX parsed in main with size (10 MB) and row (20k) limits; never execute formulas; formula-injection guard on CSV export (prefix `= + - @`) |
| Personal data | minimal (staff names); customer data not collected in MVP; EU-hosted cloud; export + delete flows; no PII in logs |
| Dependencies | pin exact versions (the repo uses `"latest"` today); Dependabot; `npm audit` gate |

---

## 10. Edge cases

| Situation | Expected behaviour |
|---|---|
| Empty cart → Pay | button disabled |
| Invalid price/qty (0, negative, text) | field-level error; nothing saved |
| Scan an unknown barcode | owner: quick-add with barcode pre-filled; cashier: "not found" + search |
| Duplicate barcode on save | blocked, shows the product that already uses it |
| Power cut / crash mid-sale | SQLite transaction: the sale is either fully saved or not at all; cart restored from autosave on restart |
| Printer off / no paper / unplugged | sale saved; clear message; Reprint in History; drawer still kicks if on a separate port |
| No internet for days | everything works; sync icon shows pending count; licence grace; catches up when back |
| Sync response lost | retry with same eventIds → server ignores duplicates |
| Cloud API down | same as offline; no user-facing errors except the sync icon |
| PC clock wrong / changed | sale timestamps also store a monotonic `deviceSeq`; cloud records `receivedAt`; licence detects rollback (now < lastSeen) → asks for online check |
| Two people try to run the shop on two PCs | second activation replaces the first (owner confirms); old device goes read-only |
| Negative stock | allowed by default with a warning (setting); shown in the low-stock report |
| Price changed while a sale is held | held cart keeps original prices; warning on recall |
| Return of an item from an archived product | allowed; stock goes back into the archived variant |
| Return more than sold / twice | blocked by the invariant |
| Shift left open overnight | next login: "Close yesterday's shift first" |
| Large catalog (20k variants) / years of sales | FTS search; indexed date ranges; reports aggregate in SQL; archive old outbox rows |
| App update with DB migration fails | automatic pre-migration backup → restore → keep old version → report to Sentry |
| Disk full | warn at 500 MB free; block new sales only at 50 MB, with clear instructions |
| Antivirus quarantines app | code-signing reduces it; support doc |
| Lost owner password and PIN | cloud password reset via email/SMS → sign in on the PC → reset PIN |
| Accessibility | keyboard-only operation; screen-reader labels on main controls; high-contrast theme |

---

## 11. Performance & scalability

- **Local:**
  - adding a scanned line in under 50 ms;
  - completing a sale in under 200 ms, excluding the printer;
  - search in under 100 ms on 20k variants with FTS5.
  - All of these are easy for SQLite on a cheap PC. Keep the renderer light, and use virtualised lists for large tables.
- **Printing:** render the receipt bitmap once per sale (about 100 ms) and send it async, so it never blocks the next sale.
- **Cloud:** 50 shops × 300 events/day ≈ 15k rows/day, which is trivial for Postgres.
  - Index `(shopId, createdAt)` and unique `(shopId, eventId)`.
  - Push batching keeps request counts low.
  - Dashboard queries aggregate per shop per day. If they slow down, add a daily summary table updated on push.
- **Not needed:** Redis, queues, microservices, a search engine, CRDTs.

---

## 12. Testing strategy

**Unit tests (`pos-core`, highest value):**
- cart totals;
- line and sale discounts and caps;
- change calculation;
- split payments;
- return eligibility and remaining-returnable math;
- exchange balance;
- stock delta per operation;
- shift expected cash (float + cash sales − cash refunds ± cash in/out);
- receipt number sequence;
- licence validation (expiry, grace, clock rollback).

**Integration tests:**
- SQLite repository functions inside transactions (sale writes all rows or none);
- migrations, from every past schema version to the current one;
- outbox → `/api/sync/push` against a test Postgres (idempotency, wrong shop rejected, replaced device rejected);
- snapshot restore round-trip (local → cloud → new local gives identical data and stock).

**E2E (Playwright for Electron):**
1. First run → activate → add product → open shift → sell → receipt rendered (to a file printer) → close shift; Z-report numbers are correct.
2. Return and exchange.
3. Receive stock → stock correct.
4. Offline sale → reconnect → cloud has it once.
5. Cashier blocked from owner actions; the PIN override works and is audited.

**Security tests:**
- IPC rejects malformed input;
- the renderer cannot access Node;
- sync API authz (other shop, revoked token, oversized payload);
- admin endpoints require the admin role + 2FA;
- no secrets in the packaged app (scan the `.asar`).

**UI tests:**
- RTL rendering of the Sell screen and receipt;
- keyboard shortcuts;
- axe checks on the main screens.

**Hardware (manual matrix, before each release):** 2–3 popular 80 mm printers [ASSUMPTION: Xprinter/Epson-compatible are common locally], one label printer, a USB scanner and a cash drawer, on Windows 10 and Windows 11.

**Prioritised checklist (gate every merge on 1–5):**
1. ☐ pos-core totals/returns/shift tests
2. ☐ Sale transaction atomicity
3. ☐ Sync idempotency + tenant isolation
4. ☐ Migration upgrade path
5. ☐ Core E2E sale → close shift
6. ☐ Permission matrix
7. ☐ Arabic receipt render snapshot
8. ☐ Restore round-trip
9. ☐ Licence offline/grace/rollback
10. ☐ No secrets in build

---

## 13. MVP definition

- **MVP:** M1–M23. That is install/activate, products with variants and import, sale screen with cash and external-card recording, hold/recall, returns and exchanges, receive and adjust stock, shifts with cash closing, reports, barcode labels, image-based Arabic/French receipts, audit log, cloud backup/restore, owner phone dashboard (read-only), licence with offline grace, local backups, signed auto-update, admin console, ar/fr.
  - *Why:* this is the smallest product a shop owner would pay for instead of a notebook or a cracked POS. Backup, cash closing and the audit trail are the reasons to pay.
- **Post-MVP:** IMEI/serials, customer credit book, suppliers + purchase history, promotions, owner push alerts, weighted-average cost, online plan payment.
  - *Why:* these are frequent requests, but each is a separate workflow that is easier to design once shops use the core every day.
- **Future:** formal invoices + TVA, multi-till, multi-shop transfers, loyalty, card-terminal integration, repairs, e-commerce sync, Android owner app.
  - *Why:* these need either a regulatory review or the hard multi-writer sync problem.

---

## 14. Development plan

| Phase | Tasks | Depends | Result | Risks |
|---|---|---|---|---|
| **0 — Emergency & reset** (1 day) | rotate/abandon secrets & DB; purge or privatise repo; `.gitignore`; create `archive/marketplace` branch; on `main` remove marketplace/apps copies/mobile/restaurant+grocery builds/status docs/committed node_modules | — | clean, safe repo | deleting something needed → it's on the archive branch |
| **1 — Discovery (parallel, 2 weeks)** | visit 10–15 shops; clickable prototype of Sell + Products + Close shift; confirm assumptions in §16; recruit 5 pilots; buy 2 printers + scanner + drawer | — | validated scope | no pilot shops → revisit the product before Phase 4 |
| **2 — Spikes (week 1)** | Arabic receipt as raster on a real printer; drawer kick; scanner detection; electron-builder + code signing + auto-update on a test feed | 0 | technical risks retired | printer models vary |
| **3 — Foundation** | new Electron app skeleton (Vite + React + TS), secure window config, typed IPC, SQLite + migration runner, `pos-core` package with tests, i18n/RTL shell, CI (typecheck, lint, unit, gitleaks, build) | 0, 2 | app opens, empty screens, CI green | IPC boilerplate drift → generate types from one schema |
| **4 — Catalog** | categories, products, variants grid, barcode uniqueness, FTS search, import CSV/XLSX, labels | 3 | catalog usable | variant UX |
| **5 — Selling** | users + PIN, shifts, sale screen, payment, hold/recall, receipt render/print, history, reprint, void | 4 | real sales possible | speed/keyboard flow |
| **6 — Returns & stock** | returns/exchanges, receive, adjust/count, low stock, stock ledger rebuild check | 5 | stock trustworthy | return edge cases |
| **7 — Cash & reports & audit** | shift close/Z-report, cash in/out, reports, audit log + viewer | 5, 6 | owner value | report correctness |
| **8 — Cloud** | new Prisma schema, accounts, device activation, licence signing, sync push, snapshot restore, owner dashboard, admin console | 3 (can start in parallel with 4) | backup + remote view | sync bugs → idempotency tests first |
| **9 — Hardening** | permissions matrix tests, Electron security review, migration upgrade tests, local backups, disk/clock edge cases, Sentry | all | release candidate | |
| **10 — Pilot** | install at 5 shops in person; daily check-ins for 2 weeks; fix list; then pricing | 9 | real usage | adoption |

---

## 15. AI app-builder strategy

- **Build first:** `pos-core` (pure functions + tests), then the SQLite schema + migrations, then the typed IPC layer. UI comes after. Bugs in totals, stock or shift math directly cost shop owners money, so that logic must be tested before any screen uses it.
- **One slice per prompt:** e.g. "Products list + create product with variants + tests". Never "build the POS".
- **Risky areas for generated code:**
  - Electron security flags (AI often enables `nodeIntegration`);
  - IPC that passes raw SQL or arbitrary paths;
  - migrations;
  - sync idempotency;
  - money rounding;
  - timezone/day boundaries in reports;
  - printer code (lots of copy-pasted ESC/POS snippets that don't handle Arabic);
  - deleting "unused" code.
- **Put these rules in every prompt (or a `CLAUDE.md`):**
  - Money and quantities are integers.
  - Business logic lives only in `pos-core`.
  - The renderer never accesses Node, SQL or the filesystem.
  - Every IPC handler validates input with Zod.
  - Every write transaction also writes an outbox row.
  - Sales are never deleted.
  - No DB credentials in the desktop app.
  - No new dependencies without asking.
  - No status/summary `.md` files.
- **Lock before implementation:**
  - single till per shop;
  - the data model in §7;
  - the permission matrix in §8;
  - receipts as raster;
  - the sync contract in §6.4;
  - licence rules (grace → read-only, never lock-out);
  - integer DZD.
- **After every change:** `typecheck + unit + integration`; after each phase, the E2E suite plus one manual sale on the real printer.
- **Always review manually:** Electron `BrowserWindow`/`webPreferences`, preload/IPC, migrations, sync endpoints, licence verification, anything touching tokens, and `electron-builder` config (to make sure no `.env` or config ends up in the package).

---

## 16. Final specification (concise)

1. **Product:** offline-first retail POS + stock for small Algerian shops on Windows, with cloud backup and an owner phone dashboard.
2. **Users:** shop owner (buyer), cashier, platform admin.
3. **MVP:** M1–M23 (§3, §13).
4. **Flows:**
   - first install/activate;
   - daily open → sell → close shift;
   - return/exchange;
   - receive stock;
   - adjust/count;
   - restore to a new PC;
   - remote view.
5. **Screens:**
   - Desktop: PIN, Sell, Payment, History, Return/Exchange, Products (+ variants, import, labels), Stock (receive/adjust), Shift close, Reports, Settings, Activation/Restore.
   - Web: Owner dashboard (3 tabs), Admin console.
6. **Stack:**
   - Desktop: Electron + React/Vite/TS, better-sqlite3 (WAL, FTS5), typed IPC + Zod, `pos-core` shared package, raster ESC/POS printing, electron-updater with code signing.
   - Cloud: Next.js on Vercel, Postgres (Neon EU) + Prisma, Auth.js.
   - Sentry for errors.
7. **Architecture:** a local-first single writer per shop. An outbox pushes idempotent events to the cloud mirror; the cloud is used for backup, dashboard, licence and admin.
8. **Entities:**
   - Local + cloud: Shop, User, Category, Product, Variant, StockMovement, StockReceipt, Shift, CashMovement, Sale, SaleLine, Payment, AuditEvent.
   - Local only: Outbox, HeldCart.
   - Cloud only: Account, Device, Licence, PlanPayment.
9. **Auth:** cloud accounts (owner/admin, admin with 2FA); per-device revocable tokens; local staff PINs; owner-PIN overrides; signed offline licence.
10. **Integrations:**
    - MVP: one email or SMS provider for password reset, Sentry, a code-signing certificate, update hosting.
    - Later: Chargily for plan payments.
11. **Security:** §0 fixes, no DB credentials on clients, Electron hardening, append-only audit, tenant-scoped sync, rate limits, signed updates, pinned dependencies, secret scanning.
12. **Testing:** §12; checklist items 1–5 gate every merge.
13. **Phases:** §14 (0–10), with discovery running in parallel with the spikes.
14. **Main risks:**
    - no committed shops yet;
    - crowded, cheap market and piracy;
    - Arabic printing across printer models;
    - migration/update failures on shop PCs;
    - code-signing cost and SmartScreen;
    - scope creep back to the marketplace.
15. **Open questions** (answer from shop visits):
    - **a.** Which sub-segment first: clothing/shoes or phones/accessories? (Phones need IMEI tracking.)
    - **b.** Do shops use touch screens or keyboard + mouse?
    - **c.** Whole dinars only, or do prices need centimes?
    - **d.** Typical printers already installed?
    - **e.** Will owners pay monthly, or only yearly/one-time? This decides the licence plans.
    - **f.** Is a card terminal (TPE) common in these shops?
    - **g.** When will formal invoices become necessary?
16. **Assumptions:**
    - 1 till per shop;
    - cash-dominant;
    - no customer data in the MVP;
    - whole-DZD prices;
    - Western digits;
    - EU hosting acceptable;
    - Arabic + French;
    - Windows 10/11 PCs with USB printers;
    - Algerian personal-data law 18-07 applies to cloud data (confirm with a lawyer).

---

## Recommended decision

**Verdict: technically feasible and a sensible pivot. It needs clarification on demand (no shops yet) and a redesign of the existing desktop architecture. Don't build on the current Electron app as it is.**

- **Feasible:** a single-till offline POS with cloud backup is a well-understood problem. The repo already has useful pieces: Electron setup, SQLite offline module, barcode scanner handling, vendor UI components, Prisma/Auth.js on the cloud side.
- **Redesign needed:** the current desktop app puts the shared database password on shop PCs, runs a whole Next.js server inside Electron, and syncs without idempotency. Those three things must change. The rest of the repo is mostly marketplace scope to archive.
- **Biggest risk is the market, not the code:** you have no committed shops and the market has cheap local options. Run discovery (Phase 1) in parallel with the technical spikes. Don't start building selling features (Phase 5) until at least 5 shops have agreed to pilot.

### Exact next prompt to give me
> Do Phase 0 and Phase 2 from `docs/PRODUCT_SPEC_AND_ANALYSIS.md`.
> **Phase 0:**
> - Walk me through rotating the exposed secrets and making the repo safe; I'll do the dashboard steps myself.
> - Then create the branch `archive/marketplace` from the current `main`.
> - On a new branch `pos-reset`, remove the folders the spec lists as out of scope, the committed `node_modules`, and the root status `.md` files. Do it in separate commits per area, and show me the list of what will be deleted before deleting.
> - Untrack `.env.production`, fix `.gitignore`, and add a gitleaks check to CI.
>
> **Phase 2:** create a minimal Electron + Vite + React + TypeScript spike app in `apps/pos` with secure `webPreferences`. It should:
> - render a sample Arabic/French receipt from HTML to a bitmap and print it as ESC/POS raster to a USB thermal printer (with a "save to PNG" fallback when no printer is connected);
> - send the cash-drawer kick command.
>
> Don't build any POS features yet, don't add dependencies beyond what the spike needs (list them first), and don't create status `.md` files. Stop after each phase and show me the diff.
