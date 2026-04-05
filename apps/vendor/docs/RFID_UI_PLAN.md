# RFID System – UI Plan

This document outlines a plan to build a full **RFID UI** for the AlBaz Vendor app: screens, data model, APIs, and integration with existing inventory and POS. It builds on [RFID_INTEGRATION_STEPS.md](./RFID_INTEGRATION_STEPS.md) (hardware, Electron RFID module, product linking).

---

## Goals

- **Live scanning dashboard** – Real-time view of RFID reads and activity.
- **Smart warehouse map** – Visual map/zones with item locations and movement.
- **RFID item detail page** – Single tag/product view with history and actions.
- **RFID gate activity screen** – Gate/reader events (in/out, zone changes).
- **RFID alerts & exceptions** – Unread tags, duplicates, unknown tags, low-read zones.
- **Inventory auto-update panel** – Sync RFID state (location/stock) with inventory.
- **RFID device management** – Readers, gates, serial/USB config, health.

---

## 1. Data Model (Backend / Offline)

Extend the existing model so the UI has something to display and react to.

| Entity | Purpose |
|--------|--------|
| **Product** | Already has optional `rfidTagId`. Keep it; use for “tag ↔ product” link. |
| **RfidReadEvent** | One row per read: `tagId`, `readerId`, `gateId` (optional), `zoneId` (optional), `timestamp`, `direction` (in/out/none), `rawRssi` (optional). |
| **RfidReader / RfidGate** | Reader/gate config: `id`, `name`, `type` (fixed/mobile/gate), `zoneId`, `serialPath` (if serial), `lastSeenAt`, `status` (online/offline/error). |
| **RfidZone** | Zone for map: `id`, `name`, `displayOrder`, `bounds` (e.g. `{ x, y, w, h }` or polygon), `readerIds[]`. |
| **RfidAlert** | Alert/exception: `id`, `type` (unknown_tag, duplicate_read, zone_mismatch, reader_offline, low_read_rate), `tagId`, `readerId`, `payload`, `createdAt`, `acknowledged`. |

**Where to store (phased):**

- **Phase 1 (Electron-only):** In-memory or SQLite in Electron (e.g. extend `offline-db.js`): recent read events, configured readers/zones, alerts. No backend required.
- **Phase 2 (Full stack):** Add Prisma models and API routes for `RfidReadEvent`, `RfidReader`, `RfidZone`, `RfidAlert` so web + Electron can share state and persist across restarts.

---

## 2. Screen-by-Screen Plan

### 2.1 Live Scanning Dashboard

**Purpose:** Central view of “what is being read right now” and recent activity.

**Content:**

- **Live feed:** Last N read events (e.g. 50), auto-scrolling. Each line: time, tag ID, reader/gate name, zone (if any), linked product name (if any).
- **Summary cards:** Scans in last 1 min / 5 min; unique tags; readers online.
- **Filters:** By reader, zone, time range, “linked product only”.
- **Source of data:**  
  - Electron: main process buffers recent reads and exposes via IPC (e.g. `rfid-get-recent-events`) or pushes with `rfid-events-batch`.  
  - Backend: optional WebSocket or polling `/api/rfid/events` for persistence.

**UI placement:** New tab **“RFID”** or **“RFID Dashboard”** in the vendor app sidebar (e.g. next to Inventory, POS). One route: `/vendor` with tab `rfid-dashboard`.

**Components (suggested):**

- `RfidDashboardTab.tsx` – layout, filters, summary cards.
- `RfidLiveFeed.tsx` – virtualized or simple list of events, real-time updates.
- Reuse Card, Badge, Table from existing tabs.

---

### 2.2 Smart Warehouse Map

**Purpose:** Visual representation of zones and where tags were last seen (or are “in” a zone).

**Content:**

- **Map canvas:** SVG or HTML overlay (e.g. on a background image or grid). Zones drawn as shapes; optional labels.
- **Per zone:** Name, last read count (or “items in zone” if you infer from reads), color by activity/alert.
- **Click zone** → filter dashboard or open “read events in this zone”.
- **Optional:** “Item dots” for last known position per tag (e.g. last read’s zone).

**Data:**

- Zones: from `RfidZone` (bounds, name, readerIds).
- “Items in zone”: from recent `RfidReadEvent` grouped by zone (e.g. last 5 min) or from a computed “current location” per tag.

**UI placement:** Sub-view inside RFID tab (e.g. “Dashboard | Map”) or a dedicated “Warehouse map” tab.

**Components:**

- `RfidWarehouseMap.tsx` – canvas + zone shapes + optional item markers.
- `RfidZoneTooltip.tsx` or inline labels for zone stats.

---

### 2.3 RFID Item Detail Page

**Purpose:** Deep dive on one RFID tag: linked product, read history, actions (link product, mark missing, etc.).

**Content:**

- **Header:** Tag ID, status (linked / unlinked), linked product name + link to inventory product.
- **Read history:** Table or timeline of reads (time, reader, zone, direction).
- **Actions:** “Link to product” (open product picker or barcode scan), “Unlink”, “Mark missing / found” (if you track that).
- **Optional:** Small sparkline of read frequency over time.

**Data:** One tag ID → fetch product by `rfidTagId`; fetch `RfidReadEvent` for this tagId (paginated).

**UI placement:** Route like `/vendor?tab=rfid-dashboard&rfidTag=EPC123` or a slide-over / modal “Item detail” opened from the live feed (click tag) or from a search-by-tag field.

**Components:**

- `RfidItemDetail.tsx` or `RfidItemDetailPage.tsx` – header, history table, actions.
- `RfidLinkProductDialog.tsx` – search/select product and set `rfidTagId`.

---

### 2.4 RFID Gate Activity Screen

**Purpose:** Focus on gate/reader-level activity: who (which gate) saw what, and when; useful for “entrance/exit” or “zone boundary” gates.

**Content:**

- **Per-gate panels (or list):** Each gate shows: name, status, last 10–20 reads (tag, time, direction in/out if applicable).
- **Direction:** If readers support “in” vs “out” (or two readers per gate), show direction; else “read”.
- **Time range filter:** e.g. last hour, today.
- **Optional:** Simple count “in” vs “out” per gate.

**Data:** `RfidReadEvent` filtered by `gateId` or `readerId`; reader/gate list from `RfidReader` with `type: 'gate'`.

**UI placement:** Sub-tab under RFID: “Dashboard | Map | Gates” or “Gate activity”.

**Components:**

- `RfidGateActivity.tsx` – list of gates, each with a small read log.
- Reuse live-event row component from dashboard for consistency.

---

### 2.5 RFID Alerts & Exceptions

**Purpose:** Single place to see and acknowledge anomalies (unknown tags, duplicate reads, reader down, etc.).

**Content:**

- **Alert list:** Type, tag/reader, message, time, acknowledged state. Filter by type, date, acknowledged.
- **Actions:** “Acknowledge”, “Link tag to product” (for unknown_tag), “Dismiss”.
- **Summary badges:** Count by type (e.g. 3 unknown, 2 reader offline).

**Alert types (examples):**

- `unknown_tag` – tag read but no product linked.
- `duplicate_read` – same tag read again within X seconds at same reader (configurable threshold).
- `zone_mismatch` – tag read in unexpected zone (if you define rules).
- `reader_offline` – reader not seen for Y minutes.
- `low_read_rate` – reader’s read count dropped below threshold.

**Data:** `RfidAlert` table; optionally generate alerts in main process or backend when processing reads.

**UI placement:** Sub-tab “Alerts” under RFID; optional badge on sidebar “RFID” if unacknowledged count > 0.

**Components:**

- `RfidAlertsTab.tsx` – filters, list, acknowledge/dismiss.
- `RfidAlertRow.tsx` – one row with type icon, message, actions.

---

### 2.6 Integrate to Inventory – Auto-Update Panel

**Purpose:** Keep inventory in sync with RFID state (e.g. “last seen” location, or stock-by-zone) and let users configure what “counts” as stock.

**Content:**

- **Panel/section** (e.g. inside Inventory tab or RFID tab):
  - Toggle or rules: “Use RFID reads to update product location” / “Count only tags seen in zone X as in stock”.
  - List of products with RFID tag: last seen zone, last seen time; button “Refresh from RFID”.
- **Auto-update rules (optional):** e.g. “If tag not seen in 24 h, set location to Unknown” or “Stock = count of unique tags in zone ‘Warehouse’”.
- **Sync status:** Last run time, count updated, errors.

**Data:** Reads → aggregate by tag → optional “current zone” per tag; join to product via `rfidTagId`. Inventory product can get optional `lastRfidZoneId`, `lastRfidSeenAt` (or keep that only in RFID store and join at read time).

**UI placement:**  
- **Option A:** “RFID” tab → sub-tab “Inventory sync”.  
- **Option B:** “Inventory” tab → collapsible section “RFID sync” or “RFID location”.

**Components:**

- `RfidInventorySyncPanel.tsx` – toggles, product list with last-seen, refresh button, optional rule form.
- Reuse InventoryTab product table with extra columns (last RFID zone, last seen).

---

### 2.7 RFID Device Management Screen

**Purpose:** Configure readers/gates, serial ports, health, and (optionally) zones.

**Content:**

- **Reader list:** Name, type (keyboard/serial/gate), connection (e.g. “Keyboard wedge”, “COM3”), status (online/offline), last seen. Actions: Edit, Remove, “Test read”.
- **Add reader:** Form: name, type, if serial: port dropdown (from `rfid-list-ports`), baud rate. Save to local config or backend.
- **Zones (optional):** List zones; add/edit zone (name, bounds or linked readers). Used by map and “items in zone”.
- **Global settings:** Prefix for keyboard wedge (e.g. `RFID:`), duplicate-read window (seconds), “alert when reader offline after X min”.

**Data:** `RfidReader` (and optionally `RfidZone`); in Phase 1 stored in Electron (e.g. JSON file or SQLite); in Phase 2 from API. Port list from existing `electronAPI.rfid.listPorts()`; connect via `electronAPI.rfid.connectSerial(path, baud)`.

**UI placement:** “Settings” tab → “RFID” / “Hardware” section, or RFID tab → “Devices” sub-tab. Reuse existing Settings serial port UI pattern if any.

**Components:**

- `RfidDeviceManagement.tsx` – reader list, add/edit form, test button.
- `RfidReaderForm.tsx` – name, type, port, baud.
- Optional: `RfidZoneForm.tsx` for zone CRUD.

---

## 3. Navigation and Routing

**Suggested structure:**

- **Sidebar:** One entry “RFID” (icon: Tag or Radio).
- **RFID section tabs (under `/vendor` with tab state):**
  - **Dashboard** – live scanning dashboard.
  - **Map** – smart warehouse map.
  - **Gates** – gate activity.
  - **Alerts** – alerts & exceptions.
  - **Inventory sync** – auto-update panel.
  - **Devices** – device management (or move to Settings).

**Item detail:** Modal or slide-over from dashboard/map when clicking a tag; URL param `?rfidTag=...` for deep link.

**Consistency:** Reuse existing vendor layout (sidebar + top tabs + content), same Card/Table/Badge/Dialog patterns, and i18n (translate) for all new strings.

---

## 4. Real-Time and Data Flow

- **Electron (Phase 1):**
  - Main process: on each RFID read, push to a bounded in-memory buffer (e.g. last 500 events); optionally run rules (duplicate, unknown tag) and push to an alerts buffer.
  - Expose: `rfid-get-recent-events`, `rfid-get-alerts`, `rfid-subscribe-events` (optional IPC push). Renderer polls or subscribes and updates React state.
- **Backend (Phase 2):**
  - POST `/api/rfid/events` (batch) from Electron or from a middleware that receives reader output; store `RfidReadEvent`.
  - GET `/api/rfid/events`, `/api/rfid/alerts`, `/api/rfid/readers`, `/api/rfid/zones` for dashboard, gates, alerts, map.
  - Optional WebSocket for live dashboard (or short-interval polling).
- **Inventory sync:** Background job or “on demand” in UI: aggregate reads by tag → join product by `rfidTagId` → update product’s “last zone” or run stock rules → optionally PATCH inventory API.

---

## 5. Implementation Order (Suggested)

| Order | Item | Depends on |
|-------|------|------------|
| 1 | Data model (in-memory/SQLite in Electron): RfidReadEvent, RfidReader, RfidAlert; buffer reads in main process | Existing rfid-scanner + preload |
| 2 | RFID Device management screen (reader list, add serial reader, listPorts/connectSerial) | 1 |
| 3 | Live scanning dashboard (recent events, summary cards, filters) | 1, 2 |
| 4 | RFID alerts & exceptions (list, acknowledge, generate unknown_tag from reads) | 1 |
| 5 | RFID item detail page (by tag: history, link product) | 1, product rfidTagId |
| 6 | RFID gate activity screen (per-gate event list) | 1, 3 |
| 7 | Smart warehouse map (zones, optional “items in zone”) | 1, RfidZone |
| 8 | Inventory auto-update panel (last seen, refresh, optional rules) | 1, Inventory API |
| 9 | (Optional) Backend APIs + Prisma for persistence and multi-client | All above |

---

## 6. Tech Notes

- **Vendor app stack:** Next.js (React), Electron, existing tabs/dialogs. New screens = new tab components under `apps/vendor/components/tabs/` (e.g. `RfidDashboardTab.tsx`, `RfidAlertsTab.tsx`) and optional sub-routes or query params for item detail.
- **State:** React state + optional context for “current RFID events”; in Phase 2 add API client and possibly WebSocket hook.
- **i18n:** Use existing `translate(fr, ar)` for all new UI strings.
- **Accessibility:** Same as rest of app: labels, keyboard nav, RTL support for Arabic where applicable.

---

## 7. Summary Table

| Screen | Main content | Data source | Placement |
|--------|--------------|-------------|-----------|
| Live scanning dashboard | Live feed, summary cards, filters | RfidReadEvent buffer, readers | RFID tab → Dashboard |
| Smart warehouse map | Zones, optional item positions | RfidZone, RfidReadEvent | RFID tab → Map |
| RFID item detail | Tag history, link product, actions | Product by tag, RfidReadEvent | Modal/slide from dashboard or ?rfidTag= |
| RFID gate activity | Per-gate read log, direction | RfidReadEvent by gate | RFID tab → Gates |
| RFID alerts & exceptions | Alert list, acknowledge, link tag | RfidAlert | RFID tab → Alerts |
| Inventory auto-update panel | Sync rules, last-seen per product, refresh | Reads + product rfidTagId | RFID tab → Sync or Inventory section |
| RFID device management | Reader CRUD, serial config, zones | RfidReader, RfidZone, listPorts | RFID tab → Devices or Settings |

This plan keeps the existing RFID hardware integration (keyboard/serial, POS “scan to add to cart”) and adds a full operational UI for monitoring, mapping, alerts, and inventory sync.
