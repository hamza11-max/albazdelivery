# RFID Integration Steps – Vendor App

This guide describes how to integrate an **RFID system** into the AlBaz Vendor desktop app (Electron + Next.js). The app already has a barcode scanner module; RFID can follow the same pattern.

---

## 1. Choose RFID hardware and interface

**Implemented:** Keyboard wedge (see below). The reader must send a **prefix `RFID:`** before the tag ID so the app can tell RFID from barcode (e.g. `RFID:EPC123456` + Enter). Configure the reader to add this prefix if possible.

| Type | How it works | Integration effort |
|------|----------------|-------------------|
| **Keyboard wedge** | Reader acts as a USB keyboard: it "types" the tag ID and sends Enter. | **Easiest** – reuse the same HID/keyboard handling as barcode, with a separate event so the UI can treat RFID vs barcode differently. |
| **Serial (RS-232 / USB‑serial)** | Reader sends tag ID over a serial port (e.g. 9600 baud, line ending `\r\n`). | **Medium** – add an RFID module that uses `serialport` (like the barcode serial path). |
| **USB HID (custom)** | Reader uses USB HID but not as a keyboard (raw reports). | **Harder** – need `node-hid` and the reader’s protocol; only if the device doesn’t support keyboard or serial. |

**Recommendation:** Prefer a **keyboard-wedge** or **serial** RFID reader so you can mirror the existing barcode-scanner design.

---

## 2. Add an RFID module in the Electron main process

Create `apps/vendor/electron/rfid-scanner.js` that:

- **Keyboard wedge:** Uses `mainWindow.webContents.on('before-input-event', ...)` to capture rapid input; when you see a line of characters + Enter, treat it as an RFID tag ID and send it to the renderer (e.g. `mainWindow.webContents.send('rfid-scanned', tagId)`). To avoid mixing with barcode, you can use a **prefix** (e.g. reader sends `RFID:EPC123...` and Enter) or a **length/format** rule (e.g. RFID tags are a fixed length or match a pattern).
- **Serial:** If you add serial support, use the `serialport` package, open the port, use a line parser (e.g. `ReadlineParser({ delimiter: '\r\n' })`), and on each line send `rfid-scanned` with the tag ID.

Expose IPC handlers, for example:

- `rfid-list-ports` – list serial ports (if using serial).
- `rfid-connect-serial(portPath, baudRate)` – connect to a serial RFID reader (optional).
- No extra IPC needed for keyboard wedge if you only need to push tag IDs to the renderer via `rfid-scanned`.

Keep the module **optional** (like barcode): load it in `main.js` with `try { rfidScanner = require('./rfid-scanner') } catch (e) { ... }`, then call `rfidScanner.initRfidScanner(mainWindow)` and `rfidScanner.registerRfidIPC()` when the app is ready.

---

## 3. Register the RFID module in `main.js`

In `apps/vendor/electron/main.js`:

1. **Declare the module** (near other optional modules, e.g. after `barcodeScanner`):

   ```js
   let rfidScanner = null
   try {
     rfidScanner = require('./rfid-scanner')
   } catch (e) {
     console.warn('RFID scanner not available:', e.message)
   }
   ```

2. **Register IPC** in `app.whenReady()` (e.g. next to barcode/updater):

   ```js
   if (rfidScanner?.registerRfidIPC) rfidScanner.registerRfidIPC()
   ```

3. **Initialize after window is ready** (e.g. in the same place where barcode is initialized):

   ```js
   if (rfidScanner?.initRfidScanner) {
     rfidScanner.initRfidScanner(mainWindow)
   }
   ```

---

## 4. Expose RFID in the preload script

In `apps/vendor/electron/preload.js`, add to `contextBridge.exposeInMainWorld('electronAPI', { ... })`:

```js
rfid: {
  onRfidScanned: (callback) => ipcRenderer.on('rfid-scanned', (event, tagId) => callback(tagId)),
  listPorts: () => ipcRenderer.invoke('rfid-list-ports'),
  connectSerial: (portPath, baudRate) => ipcRenderer.invoke('rfid-connect-serial', portPath, baudRate),
},
```

(Adjust names if you use different IPC channel/handlers.)

---

## 5. Add TypeScript types for the RFID API

In `apps/vendor/lib/electron-api.d.ts` (or wherever `electronAPI` is typed), extend the interface:

```ts
rfid?: {
  onRfidScanned: (callback: (tagId: string) => void) => void
  listPorts: () => Promise<Array<{ path: string; manufacturer?: string; ... }>>
  connectSerial: (portPath: string, baudRate?: number) => Promise<{ success: boolean }>
}
```

---

## 6. Data model: link products to RFID tags (optional)

To look up products by RFID tag (e.g. “scan tag → add product to cart”):

- **Backend/API:** Add a field such as `rfidTagId` (or `rfidTag`) to your product schema (e.g. Prisma), and allow setting it in create/update product APIs.
- **Offline DB:** In `apps/vendor/electron/offline-db.js`, add a column `rfid_tag_id TEXT` to the `products` table (and an index if you query by it), and in sync/import export map `rfidTagId` to that column. Add something like `getProductByRfidTag(tagId)` that returns the same shape as `getProductByBarcode`.
- **IPC:** In `main.js`, add a handler e.g. `offline-get-product-by-rfid` that calls `offlineDb.getProductByRfidTag(tagId)` and returns the product (or null).
- **Preload:** Expose e.g. `offline.getProductByRfidTag(tagId)` that invokes that IPC.

Then the UI can call `getProductByRfidTag(tagId)` when it receives an RFID scan and, if found, add the product to the cart or fill the product form.

---

## 7. Use RFID in the vendor UI

Where you want to react to RFID (e.g. POS or product form):

1. **Subscribe to scans**  
   In the component that should handle RFID (e.g. POS page or a shared hook), run once (e.g. in `useEffect`):

   ```ts
   if (window.electronAPI?.rfid?.onRfidScanned) {
     window.electronAPI.rfid.onRfidScanned((tagId: string) => {
       // Look up product by RFID and add to cart, or set form field, etc.
       handleRfidScanned(tagId)
     })
     return () => { /* remove listener if your API supports it */ }
   }
   ```

2. **Implement `handleRfidScanned(tagId)`**  
   - Call `electronAPI.offline.getProductByRfidTag(tagId)` (once you add the API above).  
   - If a product is returned, add it to the cart (or open product form with that product).  
   - If not, you can fall back to searching by barcode, show “Product not linked to this RFID tag”, or open a “link RFID to product” flow.

3. **Optional: settings screen**  
   Add a “Hardware” or “RFID” section where the user can:
   - Choose “Keyboard wedge” vs “Serial”.
   - If serial: list ports via `rfid.listPorts()`, select one, and call `rfid.connectSerial(path, baudRate)`.

---

## 8. Differentiate RFID from barcode (keyboard wedge)

If both barcode and RFID readers are keyboard-wedge and feed into the same window:

- **By prefix:** Configure the RFID reader to send a prefix (e.g. `RFID:...`). In the main process, if the buffer starts with that prefix, emit `rfid-scanned`; otherwise keep using `barcode-scanned`.
- **By length/format:** If RFID tag IDs have a fixed length or a known pattern (e.g. 24 hex chars), use that to decide whether to emit `rfid-scanned` or `barcode-scanned`.
- **By device:** That would require low-level HID handling (e.g. different HID device IDs), which is more complex; usually prefix or format is simpler.

Implement this logic in the same place where you handle `before-input-event` for the RFID keyboard wedge (inside `rfid-scanner.js` or a shared “scanner” helper).

---

## 9. Testing without hardware

- **Keyboard wedge:** Simulate by having a small test script or a second keyboard that types a known string + Enter; in dev, you can also send a fake event from the main process for testing.
- **Serial:** Use a virtual serial port (e.g. com0com on Windows) and a terminal to send lines, or mock `rfid-scanned` from the main process when a test button is pressed in the UI.

---

## 10. Summary checklist

| Step | Action |
|------|--------|
| 1 | Choose RFID reader type (keyboard wedge recommended first). |
| 2 | Add `electron/rfid-scanner.js` (keyboard wedge and/or serial). |
| 3 | In `main.js`: require `rfid-scanner`, call `registerRfidIPC()` and `initRfidScanner(mainWindow)`. |
| 4 | In `preload.js`: expose `electronAPI.rfid` with `onRfidScanned`, `listPorts`, `connectSerial`. |
| 5 | In `electron-api.d.ts`: add types for `rfid`. |
| 6 | (Optional) Add `rfidTagId` to product schema and offline DB; add `getProductByRfidTag` and IPC. |
| 7 | In POS/product UI: subscribe to `onRfidScanned`, look up product by RFID, add to cart or form. |
| 8 | (Optional) Add settings UI for serial port selection. |

After this, the vendor app will support RFID in the same way it supports barcode: hardware → main process → IPC → renderer → product lookup and cart/form.
