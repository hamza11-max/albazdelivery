## AlBaz Vendor – Support & Operations Playbook

This playbook is for **internal support, ops, and field technicians** who install and maintain the AlBaz Vendor desktop app (Electron + Next.js).

---

## 1. Where Things Live

- **App installation (Windows packaged build)**  
  - Default: `C:\AlBazVendor` or a custom folder without spaces (recommended).  
  - Contains the app executable, `.next\standalone` server, and bundled Node runtime.

- **User data & config**  
  - `%APPDATA%\AlBaz Vendor\`  
  - Includes:
    - `vendor-startup.log` – main process + server startup log.  
    - `vendor-auth.json` – Electron store with device passkey, owner profile, staff accounts, and session state.  
    - Any additional Electron store files for app settings.

- **Offline database (if enabled)**  
  - Location is managed by the `offline-db` module under the user’s profile.  
  - Treat it as **critical POS data**; do not delete unless you have a valid backup.

- **Backups**  
  - Generated via the **Sync & Save** / **Backup** tab.  
  - Files are JSON exports; the operator is expected to store them on:
    - A USB drive  
    - A network share  
    - Or a cloud folder (OneDrive, Google Drive, etc.)

---

## 2. Logs & Diagnostics

### 2.1 Main Process / Server Logs

- **Startup log**  
  - Path: `%APPDATA%\AlBaz Vendor\vendor-startup.log`  
  - Contains:
    - Timestamps for `app.whenReady()`, CSP configuration, offline DB init, sync service init.  
    - `startNextStandaloneServer` information: standalone root, server dir, server stderr snippets when the Next.js server fails.  
    - Server process exit codes and last stderr lines.
  - **Usage:**  
    - First file to check when the app **does not open**, or shows only a “Starting AlBaz Vendor…” screen.  
    - Search for `Server process exited` or `Server not found`.

- **Dev logs**  
  - When running `npm run electron:dev`, logs for the main process and Next dev server appear in the terminal and browser console:
    - `[Electron] ...` for main errors.  
    - `[Next.js]` / `[Next.js Standalone]` for server logs.  
    - `[VendorApp Error]` for renderer API errors.

### 2.2 Renderer Logs

- **Browser console (dev only)**  
  - Open DevTools (Ctrl+Shift+I) in the Electron window.  
  - Look for:
    - `ErrorBoundary` messages.  
    - `[VendorApp Error]` from `errorHandling.ts`.  
    - RFID/serial errors in the RFID tabs.

---

## 3. Common Failure Scenarios & Recovery

### 3.1 App does not start / white screen

1. Check `%APPDATA%\AlBaz Vendor\vendor-startup.log`.  
2. Typical causes:
   - **Server not found**  
     - Log contains “Server not found” and lists checked paths.  
     - Fix: rebuild with `cd apps/vendor && npm run electron:build:win` and reinstall.
   - **Installed in a path with spaces** (e.g. `New folder (2)`):  
     - Log mentions “install path contains spaces”.  
     - Fix: uninstall and reinstall to `C:\AlBazVendor` or `E:\AlBazVendor`.
   - **Bundled Node missing**  
     - Log mentions “Bundled Node.js not found”.  
     - Fix: rebuild with `npm run electron:build` or install Node LTS on the machine and ensure it is in `PATH`.

### 3.2 Cannot log in / PIN or passkey issues

- **Device passkey**  
  - Owner passkey is stored in `vendor-auth` Electron store.  
  - If the passkey is lost for a pilot machine, an internal tool or manual JSON edit might be required; coordinate with engineering.

- **Owner password reset**  
  - For pilots, you can reset owner credentials by:  
    1. Backing up `vendor-auth.json`.  
    2. Deleting only the `device_owner_auth` section.  
    3. Re-running the setup flow to create a new owner password.  
  - Do **not** delete the whole file unless you are prepared to re-onboard the device.

- **Staff PIN login not working**  
  - Confirm the staff member exists in **Staff & Permissions** tab (Electron staff card).  
  - Ensure a PIN is configured and that the PIN is being entered on the login screen (not the email/password field).  
  - If all else fails, reset the staff PIN from the Staff & Permissions tab.

### 3.3 Offline DB / Sync issues

- If **offline DB fails to initialize**, `vendor-startup.log` will contain:  
  - “Offline DB not available” or “offlineDb init failed”.
- Steps:
  1. Confirm disk is not full and the user has write permissions.  
  2. Check if antivirus is blocking the SQLite DLLs or `.db` files.  
  3. If the DB is corrupted, restore from the most recent JSON backup (see section 4).

### 3.4 RFID not working

- Check **Settings → System status**:
  - RFID module should show **Enabled** for the desktop build where `rfid-store` is bundled.  
  - If disabled, the module is not present or failed to load; reinstall from a known-good installer.
- On the **RFID dashboard**:
  - If there are no recent events and no device detected:
    - Check that the serial port is configured in **RFID Device Management**.  
    - Verify that the USB reader appears in Windows Device Manager and that the COM port is correct.

---

## 4. Backups & Restore

### 4.1 Creating a Backup

1. Open **Sync & Save** (or **Backup**) tab.  
2. Click **“Créer une sauvegarde / إنشاء نسخة احتياطية”**.  
3. A JSON file is downloaded with:
   - Products, sales, customers, suppliers, staff, coupons, and settings.  
4. Copy this file to:
   - External drive, NAS, or cloud folder.

> **Recommendation:** At least **daily backups** for active shops. For high-volume shops, do both mid-day and end-of-day backups.

### 4.2 Restoring a Backup

1. Ensure the shop is **closed** and nobody is using the app.  
2. Go to **Sync & Save → Restore**.  
3. Select the backup JSON file.  
4. Confirm the warning that this will replace current local data.  
5. After successful restore, the app reloads and all data (inventory, sales, customers, etc.) is restored to the backup snapshot.

> Never overwrite a working installation without having at least one **fresh backup** on external storage.

---

## 5. Updates & Rollback

### 5.1 Updating the App

- Standard flow (for pilot / managed installs):
  1. Download the new installer `.exe` from the internal distribution channel.  
  2. Run it **on top of** the existing installation directory (no need to uninstall).  
  3. After install, launch the app and verify:
     - POS login works.  
     - A test sale can be completed.  
     - Inventory and RFID dashboards load.

- Auto-update module (if enabled):
  - Uses `electron-builder` auto-updater.  
  - For production, ensure:
    - The update server URL is correct.  
    - Builds are code-signed.  
    - Rollback path exists (ability to reinstall a previous installer if a deployment goes bad).

### 5.2 Rollback Procedure

If a new version is broken:

1. Close AlBaz Vendor.  
2. Install the previous **known-good** installer (keep a copy in your support archive).  
3. Restore the most recent backup if data format changed between versions and causes issues.  
4. Capture:
   - `vendor-startup.log`  
   - A copy of the failing installer version  
   - Screenshots of any visible error messages  
   and send them to engineering with a short incident summary.

---

## 6. Quick Triage Checklist (On-Site)

When called on-site:

1. **Can the app open?**  
   - If not → Check `vendor-startup.log` and installer path (no spaces).
2. **Can they log in?**  
   - If not → Verify owner/staff credentials, PIN, and device passkey; check auth screens.  
3. **Can they complete a sale?**  
   - If not → Check POS screen, inventory loaded, error toasts or console.  
4. **Is inventory / RFID working?**  
   - Check Inventory and RFID tabs; verify devices and data.  
5. **Do they have a recent backup?**  
   - If data corruption is suspected, restore from the latest backup.

Document resolution steps in your internal ticketing system, including app version, Windows version, and any log snippets used in diagnosis.

