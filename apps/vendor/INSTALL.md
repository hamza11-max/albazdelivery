# Installing AlBaz Vendor (Windows)

## If the app doesn't open or shows an error

1. **Install to a path without spaces**  
   The app often fails when the path contains spaces (e.g. `C:\Program Files\AlBaz Vendor` or `E:\New folder (2)\AlBazVendor`). The server may exit with code 1 or not start.  
   **Do this:** Uninstall, then reinstall and choose a folder **without spaces**, for example:
   - `C:\AlBazVendor`
   - `E:\AlBazVendor`

2. **"Server process exited with code 1"** — If the log shows "Server ready" then "Server process exited with code 1", the embedded server crashed. Often caused by a **path with spaces**; move the app to e.g. `C:\AlBazVendor`. Rebuild with `npm run electron:build:win` and reinstall if it persists. New runs will log "Last server stderr: ..." when the server prints an error before exiting.

3. **Check the startup log**  
   If the app still doesn’t run or shows a blank/error screen, open the log file in Notepad:
   Press `Win + R`, type `%APPDATA%\AlBaz Vendor`, open `vendor-startup.log`. Look for "Blocked: install path contains spaces", "Server not found", "Server process exited", or "Last server stderr".

4. **Rebuild and reinstall**  
   If you built the installer yourself, from the project root run:
   ```bash
   cd apps/vendor
   npm run electron:build:win
   ```
   Install the new `.exe` from `apps/vendor/dist/` and use an install path **without spaces**.

## Log file location

- **Windows:** `%APPDATA%\AlBaz Vendor\vendor-startup.log`  
  (e.g. `C:\Users\<YourName>\AppData\Roaming\AlBaz Vendor\vendor-startup.log`)
