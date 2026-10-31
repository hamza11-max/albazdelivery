# Electron Setup Guide for AlBaz Vendor App

## Architecture (Windows)

The **Windows vendor app is standalone**. It bundles and runs an embedded Next.js server locally. That server is used for:

- **Backup** – syncing data to the cloud
- **Commands from customer app** – receiving instructions from the customer-facing app
- **Updates** – app updates and related checks

Core POS and offline operation do **not** depend on an external server; the embedded server is for the above features and for serving the in-app UI.

## ✅ Setup Complete!

The Electron configuration has been set up. Here's what was installed and configured:

### Installed Packages
- ✅ `electron` - Electron framework
- ✅ `electron-builder` - Build .exe installer
- ✅ `electron-updater` - Auto-update support

### Created Files
- ✅ `electron/main.js` - Main Electron process
- ✅ `electron/preload.js` - Preload script for security
- ✅ `electron-builder.yml` - Build configuration
- ✅ `assets/logo.png` - App logo (copied from project root)

## 🚀 Quick Start

### 1. Convert Logo to Icon (Required)

Before building, you need to convert the logo to icon formats:

**Option A: Use Online Converter (Easiest)**
1. Go to https://convertio.co/png-ico/
2. Upload `apps/vendor/assets/logo.png`
3. Download `icon.ico`
4. Save as `apps/vendor/assets/icon.ico`

**Option B: Use electron-icon-maker**
```bash
cd apps/vendor/assets
npm install -g electron-icon-maker
electron-icon-maker --input=logo.png --output=.
```

### 2. Environment (required for local Electron)

Create `apps/vendor/.env.local` (or set in the repo root `.env` that Next loads):

```bash
# Required — Electron JWT mint/verify fail closed without this
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3001"

# Optional for pure offline POS. If set to a remote host that is down,
# Prisma fails fast (~5s) instead of hanging ~30s.
# DATABASE_URL="postgresql://..."
# DATABASE_CONNECT_TIMEOUT_MS=5000
```

- **Offline POS** works without `DATABASE_URL` (SQLite + in-memory fallbacks).
- **Cloud features** (subscriptions, sync, remote orders) need a reachable `DATABASE_URL`.
- If Supabase/Neon is unreachable, the UI should stay usable; subscription fetch times out quickly.

### 3. Development Mode

Run the app in development mode:

```bash
cd apps/vendor
npm run electron:dev
```

This will:
- Start Next.js dev server on port 3001
- Launch Electron window
- Open DevTools automatically

**Do not commit** `dist/`, `win-unpacked/`, or `.next/` — they are gitignored. If Git still lists them, run:

```bash
git rm -r --cached apps/vendor/dist 2>nul
```

### 4. Build for Production

Build the .exe installer:

```bash
cd apps/vendor
npm run electron:build:win
```

The installer will be in `apps/vendor/dist/`

## 📦 Build Output

After building, you'll find:
- `dist/AlBaz Vendor-0.1.0-x64.exe` - Windows installer
- `dist/AlBaz Vendor-0.1.0-x64-setup.exe` - NSIS installer

## 🔧 Configuration

### App Details
- **App ID**: `com.albaz.vendor`
- **Product Name**: `AlBaz Vendor`
- **Version**: `0.1.0` (update in `package.json`)

### Window Settings
- **Default Size**: 1400x900
- **Min Size**: 1200x700
- **Port**: 3001 (Next.js server)

### Icon Location
- Windows: `assets/icon.ico`
- macOS: `assets/icon.icns`
- Linux: `assets/icon.png`

## 🔄 Auto-Update Setup (Optional)

To enable auto-updates via GitHub releases:

1. Update `electron-builder.yml`:
```yaml
publish:
  provider: github
  owner: hamza11-max
  repo: albazdelivery
```

2. Add update check in `electron/main.js`:
```javascript
const { autoUpdater } = require('electron-updater')
autoUpdater.checkForUpdatesAndNotify()
```

## 🐛 Troubleshooting

### "Standalone build not found"
- Run `npm run build:electron` first
- Make sure `.next/standalone` directory exists

### "Cannot find module"
- Run `npm install` in `apps/vendor`
- Check that all dependencies are installed

### Icon not showing
- Make sure `icon.ico` exists in `assets/`
- Verify icon file is valid (try opening it)
- Rebuild after adding icon: `npm run electron:build:win`

### Port already in use
- Change port in `electron/main.js` (line with `PORT: '3001'`)
- Or kill process using port 3001

## 📝 Next Steps

1. **Convert logo to icon** (see step 1 above)
2. **Test in dev mode**: `npm run electron:dev`
3. **Build installer**: `npm run electron:build:win`
4. **Test installer**: Run the generated .exe
5. **Distribute**: Share the installer with users

## 🔗 Connection to Main Project

The Electron app:
- ✅ Remains part of the monorepo
- ✅ Can pull updates via git
- ✅ Connects to main API server
- ✅ Can auto-update via electron-updater

## 📚 Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [electron-builder Docs](https://www.electron.build/)
- [Next.js Standalone](https://nextjs.org/docs/pages/api-reference/next-config-js/output)

