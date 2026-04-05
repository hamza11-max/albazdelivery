## AlBaz Vendor App – QA Checklist

Use this checklist before every release or when validating a new installation. Run it on a **packaged Electron build** (not only `npm run electron:dev`), ideally on a clean Windows machine similar to customer environments.

---

## 1. Installation & First Launch

- **Installer**
  - [ ] Install the app using the official installer.
  - [ ] Confirm the default install path does **not** contain spaces (e.g. `C:\AlBazVendor`).
  - [ ] Verify antivirus/Windows SmartScreen do not block the installer (or document the expected prompts).
- **First launch**
  - [ ] App starts without crashing.
  - [ ] No blocking error dialogs on startup.
  - [ ] A window appears within 5–10 seconds (loading screen or auth/setup).

---

## 2. Authentication & Setup

- **Device passkey & owner setup**
  - [ ] On first run, app shows the device passkey / setup flow.
  - [ ] You can complete owner setup (name, phone, email, password).
  - [ ] After setup, the main vendor dashboard loads correctly.
- **Staff login**
  - [ ] You can create at least one staff account.
  - [ ] Staff can log in using configured credentials (email/phone or code+PIN, depending on flow).
  - [ ] Incorrect credentials show a friendly error and do not crash the app.

---

## 3. Core POS Flow

- **Basic sale**
  - [ ] Add products to the catalog (name, price, stock).
  - [ ] From POS tab, search and add items to the cart.
  - [ ] Apply a simple discount (percentage or fixed).
  - [ ] Complete a sale with at least one payment method (cash/card).
  - [ ] After payment, cart resets and no React errors appear.
- **Receipts**
  - [ ] Printing a receipt works in Electron (either to a real or virtual printer).
  - [ ] Receipt includes shop info, date, line items, totals, and payment method.

---

## 4. Inventory & Products

- **Product management**
  - [ ] Create, edit, and delete products from the Inventory tab.
  - [ ] Low‑stock thresholds and alerts behave as expected.
  - [ ] Product search and filters work without errors.
- **Coupons & loyalty (if enabled)**
  - [ ] Create a coupon and apply it in POS.
  - [ ] Loyalty/points settings can be configured and saved.

---

## 5. RFID – Device Management & Dashboard

> Skip or adapt these steps on machines without RFID hardware; at minimum, verify that UI loads and handles “no device” gracefully.

- **Device management**
  - [ ] Open the RFID Devices tab.
  - [ ] List of configured readers loads without errors.
  - [ ] Serial ports dropdown shows available ports (or a clear “no port” state).
  - [ ] Adding a keyboard or serial reader works and persists across app restarts.
- **Dashboard & alerts**
  - [ ] Open RFID Dashboard tab; no “no handler registered” IPC errors.
  - [ ] Live feed shows recent events when tags are scanned.
  - [ ] Alerts tab shows unknown tag alerts when scanning an unlinked tag.
  - [ ] Acknowledging an alert updates the UI and does not throw errors.

---

## 6. Offline DB & Sync

- **Offline operation**
  - [ ] Disconnect the internet.
  - [ ] App can still launch and log in with local accounts.
  - [ ] Products and customers can be loaded from the offline DB.
  - [ ] A sale can be completed while offline.
- **Sync**
  - [ ] Reconnect the internet.
  - [ ] Trigger a manual sync (from Sync/Save tab).
  - [ ] Offline stats update, and no sync errors are shown in the UI or console (or errors are clear and documented).

---

## 7. Settings, System Status & Printing

- **Settings**
  - [ ] Change language (FR/AR) and verify the UI updates.
  - [ ] Toggle dark mode and confirm appearance changes.
  - [ ] Adjust opening hours and capacity (if applicable) and save.
- **System status**
  - [ ] In Settings → System status, verify:
    - [ ] Environment shows “Production” when running a packaged build.
    - [ ] Platform and app version are correct.
    - [ ] Offline DB, Sync, Barcode, Auto‑update, and RFID statuses match the actual installation (OK / Indisponible).
- **Printing**
  - [ ] Product label printing opens a preview/print dialog and renders labels correctly.

---

## 8. Auto‑Updates (If Configured)

- **Check for updates**
  - [ ] From within the app, trigger “check for updates” (if UI exists).
  - [ ] If an update is available, download and apply it without losing local data.
  - [ ] After update, confirm the app version changed and data (products, settings, offline sales) remain intact.

---

## 9. Stability & Error Monitoring

- **Long‑running session**
  - [ ] Leave the app running for at least 2–4 hours, periodically performing small actions (sales, inventory edits).
  - [ ] Confirm there are no memory leaks or performance degradation.
- **Error review**
  - [ ] Check startup and main logs for unexpected errors or stack traces.
  - [ ] Verify that any errors shown to the user are understandable and actionable.

