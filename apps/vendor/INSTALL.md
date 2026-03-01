# Installing AlBaz Vendor (Windows)

## If the app doesn't open or shows an error

### 1. Install to a path **without spaces** (most common fix)

The app often fails when the path contains spaces (e.g. `C:\Program Files\AlBaz Vendor` or `E:\New folder (2)\AlBazVendor`). The server may exit with code 1 or not start.

**Do this:** Uninstall, then reinstall and choose a folder **without spaces**, for example:
- `C:\AlBazVendor`
- `E:\AlBazVendor`
- `D:\Apps\AlBazVendor`

### 2. Check the startup log

If the app doesn't run or shows a blank/error screen, open the log file:

1. Press `Win + R`
2. Type `%APPDATA%\AlBaz Vendor` and press Enter
3. Open `vendor-startup.log` in Notepad

Look for:
- **"Blocked: install path contains spaces"** → Reinstall to a path without spaces
- **"Server not found"** → Rebuild the app (see step 5)
- **"Server process exited with code 1"** → Often path with spaces, or missing/corrupt files
- **"Last server stderr"** → Shows the real error from the Next.js server

### 3. App opens but shows "Starting..." then error

The embedded server could not start. Common causes:
- Path with spaces (reinstall to e.g. `C:\AlBazVendor`)
- Antivirus blocking the server
- Port 3001 already in use (close other apps using it, then restart)

### 4. App does not open at all (nothing happens)

- Check the log file (step 2)
- Run the installer again as Administrator
- Ensure you have .NET or Visual C++ runtimes if prompted
- Try rebooting after install

### 5. Rebuild and reinstall (if you built the installer)

From the project root:

```bash
cd apps/vendor
npm run electron:build:win
```

Then install the new `.exe` from `apps/vendor/dist/` and use an install path **without spaces**.

**Build requirements:** Node.js 20+, npm, and on Windows: PowerShell (for downloading bundled Node).

### 6. Database connection (for full features)

The app can start without a database, but for orders, products, and cloud sync you need PostgreSQL. Create `vendor-config.json` in the same folder as the `.exe` with:

```json
{
  "DATABASE_URL": "postgresql://user:password@host:5432/dbname"
}
```

## Log file location

- **Windows:** `%APPDATA%\AlBaz Vendor\vendor-startup.log`  
  (e.g. `C:\Users\<YourName>\AppData\Roaming\AlBaz Vendor\vendor-startup.log`)
