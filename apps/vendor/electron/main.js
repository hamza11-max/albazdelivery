const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { createAuthWindow, closeAuthWindow } = require('./auth-window')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Optional modules - graceful fallback if native modules aren't built for Electron
let offlineDb = null
let syncService = null
let barcodeScanner = null
let autoUpdater = null

try {
  offlineDb = require('./offline-db')
} catch (e) {
  console.warn('Offline DB not available:', e.message)
}

try {
  syncService = require('./sync-service')
} catch (e) {
  console.warn('Sync service not available:', e.message)
}

try {
  barcodeScanner = require('./barcode-scanner')
} catch (e) {
  console.warn('Barcode scanner not available:', e.message)
}

try {
  autoUpdater = require('./auto-updater')
} catch (e) {
  console.warn('Auto updater not available:', e.message)
}

let mainWindow = null
let nextProcess = null
let isAuthenticated = false
let tray = null
let isQuitting = false

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  })

  // Set app title
  mainWindow.setTitle('AlBaz Vendor App')

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Check authentication before loading
  checkAuthenticationAndLoad()

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
    if (nextProcess) {
      nextProcess.kill()
      nextProcess = null
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })
}

function startNextDevServer() {
  // Start Next.js dev server
  nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  })

  let serverReady = false

  nextProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('[Next.js]', output)
    
    // Check if server is ready
    if (!serverReady && (output.includes('Ready') || output.includes('Local:') || output.includes('localhost:3001'))) {
      serverReady = true
      // Wait a bit for server to be fully ready
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL('http://localhost:3001/vendor')
        }
      }, 2000)
    }
  })

  nextProcess.stderr.on('data', (data) => {
    console.error('[Next.js Error]', data.toString())
  })

  nextProcess.on('close', (code) => {
    console.log(`[Next.js] Process exited with code ${code}`)
    nextProcess = null
  })

  nextProcess.on('error', (error) => {
    console.error('[Next.js] Failed to start:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL('http://localhost:3001/vendor')
    }
  })
}

function startNextStandaloneServer() {
  // Start Next.js standalone server from .next/standalone
  const standalonePath = path.join(__dirname, '../.next/standalone')
  const serverPath = path.join(standalonePath, 'server.js')
  
  // Check if standalone build exists
  const fs = require('fs')
  if (!fs.existsSync(serverPath)) {
    console.error('[Electron] Standalone build not found. Run: npm run build')
    mainWindow.loadURL('about:blank')
    return
  }

  // Set PORT environment variable
  process.env.PORT = '3001'
  process.env.HOSTNAME = 'localhost'

  // Start the standalone server
  nextProcess = spawn('node', ['server.js'], {
    cwd: standalonePath,
    shell: true,
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: '3001',
      HOSTNAME: 'localhost',
    },
  })

  let serverReady = false

  nextProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('[Next.js Standalone]', output)
    
    if (!serverReady && (output.includes('Ready') || output.includes('Local:') || output.includes('localhost:3001'))) {
      serverReady = true
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL('http://localhost:3001/vendor')
        }
      }, 2000)
    }
  })

  nextProcess.stderr.on('data', (data) => {
    console.error('[Next.js Standalone Error]', data.toString())
  })

  nextProcess.on('close', (code) => {
    console.log(`[Next.js Standalone] Process exited with code ${code}`)
    nextProcess = null
  })

  nextProcess.on('error', (error) => {
    console.error('[Next.js Standalone] Failed to start:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL('http://localhost:3001/vendor')
    }
  })
}

// Authentication check and load
function checkAuthenticationAndLoad() {
  // Skip auth for development - go directly to vendor page
  isAuthenticated = true
  if (isDev) {
    // In dev, start the Next.js dev server
    startNextDevServer()
  } else {
    startNextStandaloneServer()
  }
}

// IPC handlers for authentication
ipcMain.handle('auth-login', async (event, credentials) => {
  try {
    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, error: 'Email and password required' }
    }

    // Make API call to authenticate
    const response = await fetch('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        json: true,
      }),
    })

    // Try direct login API
    const loginResponse = await fetch('http://localhost:3001/api/auth/electron-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    })

    if (loginResponse.ok) {
      const data = await loginResponse.json()
      if (data.success && data.user) {
        const Store = require('electron-store').default || require('electron-store')
        const store = new Store({ name: 'vendor-auth' })
        
        store.set('vendor_auth_state', {
          isAuthenticated: true,
          user: data.user,
          token: data.token || 'electron-session-' + Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        })
        
        isAuthenticated = true
        return { success: true, user: data.user }
      }
    }

    // Fallback: store credentials for dev mode
    const Store = require('electron-store').default || require('electron-store')
    const store = new Store({ name: 'vendor-auth' })
    
    store.set('vendor_auth_state', {
      isAuthenticated: true,
      user: {
        id: 'electron-dev',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        role: 'VENDOR',
      },
      token: 'electron-dev-' + Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    })
    
    isAuthenticated = true
    return { success: true }
  } catch (error) {
    console.error('[Electron Auth] Login error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('auth-logout', async () => {
  try {
    const Store = require('electron-store')
    const store = new Store({ name: 'vendor-auth' })
    store.delete('vendor_auth_state')
    isAuthenticated = false
    
    // Close main window and show login
    if (mainWindow) {
      mainWindow.close()
    }
    createAuthWindow()
    
    return { success: true }
  } catch (error) {
    console.error('[Electron Auth] Logout error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('auth-check', async () => {
  try {
    const Store = require('electron-store')
    const store = new Store({ name: 'vendor-auth' })
    const authState = store.get('vendor_auth_state')
    
    if (authState && authState.isAuthenticated && authState.expiresAt > Date.now()) {
      return { isAuthenticated: true, user: authState.user }
    }
    return { isAuthenticated: false, user: null }
  } catch (error) {
    console.error('[Electron Auth] Check error:', error)
    return { isAuthenticated: false, user: null }
  }
})

ipcMain.handle('auth-get-token', async () => {
  try {
    const Store = require('electron-store')
    const store = new Store({ name: 'vendor-auth' })
    const authState = store.get('vendor_auth_state')
    
    if (authState && authState.isAuthenticated && authState.expiresAt > Date.now()) {
      return authState.token
    }
    return null
  } catch (error) {
    console.error('[Electron Auth] Get token error:', error)
    return null
  }
})

ipcMain.handle('auth-get-user', async () => {
  try {
    const Store = require('electron-store')
    const store = new Store({ name: 'vendor-auth' })
    const authState = store.get('vendor_auth_state')
    
    if (authState && authState.isAuthenticated && authState.expiresAt > Date.now()) {
      return authState.user
    }
    return null
  } catch (error) {
    console.error('[Electron Auth] Get user error:', error)
    return null
  }
})

// Register keyboard shortcuts
function registerShortcuts() {
  // POS shortcuts - send to renderer
  const shortcuts = {
    'F1': 'shortcut-help',
    'F2': 'shortcut-new-sale',
    'F3': 'shortcut-search',
    'F4': 'shortcut-customer',
    'F5': 'shortcut-refresh',
    'F8': 'shortcut-discount',
    'F9': 'shortcut-payment-cash',
    'F10': 'shortcut-payment-card',
    'F12': 'shortcut-print-receipt',
    'Escape': 'shortcut-cancel',
    'CommandOrControl+P': 'shortcut-print',
    'CommandOrControl+F': 'shortcut-search',
    'CommandOrControl+N': 'shortcut-new-sale',
    'CommandOrControl+B': 'shortcut-barcode',
  }

  Object.entries(shortcuts).forEach(([key, channel]) => {
    globalShortcut.register(key, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel)
      }
    })
  })
  
  console.log('[Shortcuts] Registered POS keyboard shortcuts')
}

// Create system tray
function createTray() {
  const iconPath = path.join(__dirname, '../assets/logo.png')
  let trayIcon
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      // Create a simple 16x16 icon if file not found
      trayIcon = nativeImage.createEmpty()
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open AlBaz Vendor', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'New Sale (F2)', click: () => mainWindow?.webContents.send('shortcut-new-sale') },
    { label: 'Search (F3)', click: () => mainWindow?.webContents.send('shortcut-search') },
    { type: 'separator' },
    { label: 'Sync Now', click: () => syncService?.syncToServer?.() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } }
  ])
  
  tray.setToolTip('AlBaz Vendor App')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    }
  })
  
  console.log('[Tray] System tray created')
}

// App event handlers
app.whenReady().then(() => {
  // Initialize offline database (if available)
  if (offlineDb) {
    try {
      offlineDb.initDatabase()
    } catch (e) {
      console.warn('Failed to initialize offline database:', e.message)
    }
  }
  
  // Start sync service (if available)
  if (syncService) {
    try {
      syncService.startAutoSync(30000) // Sync every 30 seconds
    } catch (e) {
      console.warn('Failed to start sync service:', e.message)
    }
  }
  
  // Register IPC handlers (if available)
  if (barcodeScanner?.registerBarcodeIPC) {
    barcodeScanner.registerBarcodeIPC()
  }
  if (autoUpdater?.registerUpdaterIPC) {
    autoUpdater.registerUpdaterIPC()
  }
  
  createWindow()
  registerShortcuts()
  createTray()
  
  // Initialize barcode scanner after window is ready
  mainWindow.once('ready-to-show', () => {
    if (barcodeScanner?.initBarcodeScanner) {
      barcodeScanner.initBarcodeScanner(mainWindow)
    }
    if (autoUpdater?.initAutoUpdater) {
      autoUpdater.initAutoUpdater(mainWindow)
    }
  })

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // On Windows/Linux, minimize to tray instead of quitting
  if (process.platform !== 'darwin' && !isQuitting) {
    // Keep running in background
  } else if (isQuitting) {
    if (nextProcess) {
      nextProcess.kill()
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  
  // Unregister shortcuts
  globalShortcut.unregisterAll()
  
  // Stop sync service
  syncService?.stopAutoSync?.()
  
  // Close database
  offlineDb?.closeDatabase?.()
  
  // Clean up Next.js process
  if (nextProcess) {
    nextProcess.kill()
    nextProcess = null
  }
})

// IPC handlers for app updates
ipcMain.handle('app-version', () => {
  return app.getVersion()
})

ipcMain.handle('app-name', () => {
  return app.getName()
})

// IPC handlers for store operations (used by preload)
ipcMain.handle('store-get', (event, key) => {
  const Store = require('electron-store').default || require('electron-store')
  const store = new Store({ name: 'vendor-auth' })
  return store.get(key)
})

ipcMain.handle('store-set', (event, key, value) => {
  const Store = require('electron-store').default || require('electron-store')
  const store = new Store({ name: 'vendor-auth' })
  store.set(key, value)
  return true
})

ipcMain.handle('store-delete', (event, key) => {
  const Store = require('electron-store').default || require('electron-store')
  const store = new Store({ name: 'vendor-auth' })
  store.delete(key)
  return true
})

// Offline database IPC handlers
ipcMain.handle('offline-get-products', (event, vendorId) => {
  if (!offlineDb) return []
  return offlineDb.getProducts(vendorId)
})

ipcMain.handle('offline-get-product-by-barcode', (event, barcode) => {
  if (!offlineDb) return null
  return offlineDb.getProductByBarcode(barcode)
})

ipcMain.handle('offline-save-sale', (event, sale) => {
  if (!offlineDb) return { success: false, error: 'Offline DB not available' }
  return offlineDb.saveSale(sale)
})

ipcMain.handle('offline-get-customers', (event, vendorId) => {
  if (!offlineDb) return []
  return offlineDb.getCustomers(vendorId)
})

ipcMain.handle('offline-get-stats', () => {
  if (!offlineDb) return { products: 0, pendingSales: 0, customers: 0 }
  return offlineDb.getOfflineStats()
})

ipcMain.handle('offline-sync-now', async () => {
  if (!syncService || !offlineDb) return { products: 0, pendingSales: 0, customers: 0 }
  await syncService.syncToServer()
  return offlineDb.getOfflineStats()
})

ipcMain.handle('offline-download-data', async (event, vendorId) => {
  if (!syncService || !offlineDb) return { products: 0, pendingSales: 0, customers: 0 }
  await syncService.syncFromServer(vendorId)
  return offlineDb.getOfflineStats()
})

// Printing IPC handlers
ipcMain.handle('print-receipt', async (event, receiptData) => {
  try {
    const printWindow = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })
    
    // Generate receipt HTML
    const receiptHtml = generateReceiptHtml(receiptData)
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`)
    
    // Print silently to default printer
    const printers = await printWindow.webContents.getPrintersAsync()
    const thermalPrinter = printers.find(p => 
      p.name.toLowerCase().includes('thermal') || 
      p.name.toLowerCase().includes('receipt') ||
      p.name.toLowerCase().includes('pos')
    )
    
    await printWindow.webContents.print({
      silent: true,
      printBackground: true,
      deviceName: thermalPrinter?.name || '',
      margins: { marginType: 'none' }
    })
    
    printWindow.close()
    return { success: true }
  } catch (error) {
    console.error('[Print] Error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return []
  return await mainWindow.webContents.getPrintersAsync()
})

// Generate receipt HTML for thermal printing
function generateReceiptHtml(data) {
  const { 
    storeName, 
    items, 
    subtotal, 
    discount, 
    tax, 
    total, 
    paymentMethod, 
    orderNumber, 
    date,
    shopAddress,
    shopPhone,
    shopEmail,
    shopCity
  } = data
  
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${item.price.toFixed(2)}</td>
    </tr>
  `).join('')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          width: 280px; 
          margin: 0; 
          padding: 10px;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .header h1 { font-size: 16px; margin: 0; font-weight: bold; }
        .header p { font-size: 11px; margin: 2px 0; }
        .shop-info { text-align: center; font-size: 10px; margin: 5px 0; line-height: 1.4; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
        .total-row { font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${storeName || 'AlBaz Store'}</h1>
        ${shopAddress ? `<p class="shop-info">${shopAddress}</p>` : ''}
        ${shopCity ? `<p class="shop-info">${shopCity}</p>` : ''}
        ${shopPhone ? `<p class="shop-info">Tel: ${shopPhone}</p>` : ''}
        ${shopEmail ? `<p class="shop-info">${shopEmail}</p>` : ''}
        <div class="divider"></div>
        <p>Order: ${orderNumber || 'N/A'}</p>
        <p>${date || new Date().toLocaleString()}</p>
      </div>
      <div class="divider"></div>
      <table>
        <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
        ${itemsHtml}
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>Subtotal:</td><td style="text-align:right">${subtotal?.toFixed(2) || '0.00'}</td></tr>
        ${discount ? `<tr><td>Discount:</td><td style="text-align:right">-${discount.toFixed(2)}</td></tr>` : ''}
        ${tax ? `<tr><td>Tax:</td><td style="text-align:right">${tax.toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL:</td><td style="text-align:right">${total?.toFixed(2) || '0.00'}</td></tr>
      </table>
      <div class="divider"></div>
      <p>Payment: ${paymentMethod || 'Cash'}</p>
      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>شكراً لتسوقكم معنا</p>
      </div>
    </body>
    </html>
  `
}

