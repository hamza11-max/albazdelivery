# Vendor App .exe Conversion Guide

## Overview
Convert the Next.js vendor app to a Windows .exe application while maintaining connection to the main project for updates.

## Options

### Option 1: Electron (Recommended)
Wrap the Next.js app in Electron for native Windows .exe experience.

#### Advantages:
- ✅ Full native Windows experience
- ✅ Can package as standalone .exe
- ✅ Access to Node.js APIs
- ✅ Auto-update capabilities
- ✅ Large community support

#### Setup Steps:
1. Install Electron in vendor app:
```bash
cd apps/vendor
npm install --save-dev electron electron-builder
```

2. Create `electron/main.js`:
```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let nextProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Start Next.js dev server or use built files
  nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    shell: true
  })

  nextProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Ready')) {
      mainWindow.loadURL('http://localhost:3001')
    }
  })

  mainWindow.on('closed', () => {
    if (nextProcess) nextProcess.kill()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

3. Add to `package.json`:
```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:build": "next build && electron-builder",
    "electron:dev": "npm run dev & electron ."
  }
}
```

4. Create `electron-builder.yml`:
```yaml
appId: com.albaz.vendor
productName: AlBaz Vendor
directories:
  output: dist
files:
  - 'out/**/*'
  - 'node_modules/**/*'
win:
  target: nsis
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

### Option 2: Tauri (Lightweight)
Use Tauri for a smaller, faster native app.

#### Advantages:
- ✅ Very small file size (~5MB vs ~150MB for Electron)
- ✅ Better performance
- ✅ Uses system WebView
- ✅ Built with Rust (more secure)

#### Setup Steps:
1. Install Tauri:
```bash
cd apps/vendor
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api
```

2. Create `src-tauri/tauri.conf.json`:
```json
{
  "build": {
    "distDir": "../out",
    "devPath": "http://localhost:3001"
  },
  "package": {
    "productName": "AlBaz Vendor",
    "version": "1.0.0"
  },
  "tauri": {
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "AlBaz Vendor App"
      }
    ]
  }
}
```

3. Add scripts:
```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "npm run dev & tauri dev",
    "tauri:build": "next build && tauri build"
  }
}
```

### Option 3: Next.js Standalone + Portable Package
Create a portable version using Next.js standalone output.

#### Advantages:
- ✅ Native Next.js performance
- ✅ No Electron overhead
- ✅ Smaller package size

#### Setup Steps:
1. Update `next.config.mjs`:
```javascript
output: 'standalone',
```

2. Create portable launcher with `pkg` or `nexe`:
```bash
npm install -g pkg
```

3. Create `launcher.js`:
```javascript
const { spawn } = require('child_process')
const path = require('path')

const server = spawn('node', [path.join(__dirname, 'server.js')], {
  cwd: __dirname
})

server.stdout.on('data', (data) => {
  console.log(data.toString())
})

// Open browser automatically
setTimeout(() => {
  require('open')('http://localhost:3001')
}, 3000)
```

## Auto-Update Strategy

### Using Electron-Update
1. Set up update server:
```javascript
// In electron/main.js
const { autoUpdater } = require('electron-updater')

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',
  repo: 'albazdelivery',
  private: false
})

autoUpdater.checkForUpdatesAndNotify()
```

### Using Custom Update Checker
1. Check for updates on startup:
```javascript
async function checkForUpdates() {
  const response = await fetch('https://api.albazdelivery.com/version')
  const { version } = await response.json()
  if (version > currentVersion) {
    // Download and apply update
  }
}
```

## Connection to Main Project

### Git Integration
- Keep vendor app as part of monorepo
- Use git submodules or npm workspaces
- Pull updates from main branch

### API-Based Updates
- Vendor app checks main server for updates
- Downloads new version when available
- Can update specific modules without full rebuild

### Recommended Approach
1. **Development**: Use Electron with dev server (Option 1)
2. **Production**: Use Tauri for smaller size (Option 2)
3. **Updates**: Implement auto-update via API check

## Next Steps
1. Choose an option (recommended: Tauri for production)
2. Set up the framework in `apps/vendor`
3. Configure auto-update mechanism
4. Test locally before building .exe
5. Set up CI/CD for automated .exe builds

## Notes
- The vendor app remains part of the monorepo
- Updates can be pulled via git or API
- Local data can be stored in app's user data directory
- All API calls still go to main server

