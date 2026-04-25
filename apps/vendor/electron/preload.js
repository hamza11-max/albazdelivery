const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  getName: () => ipcRenderer.invoke('app-name'),
  platform: process.platform,
  isElectron: true,
  getHealth: () => ipcRenderer.invoke('app-health'),
  
  // Auth-related IPC
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth-login', credentials),
    logout: () => ipcRenderer.invoke('auth-logout'),
    checkAuth: () => ipcRenderer.invoke('auth-check'),
    getToken: () => ipcRenderer.invoke('auth-get-token'),
    getUser: () => ipcRenderer.invoke('auth-get-user'),
    getSetup: () => ipcRenderer.invoke('auth-get-setup'),
    getShopType: () => ipcRenderer.invoke('auth-get-shop-type'),
    setShopType: (shopType) => ipcRenderer.invoke('auth-set-shop-type', shopType),
    verifyPasskey: (passkey) => ipcRenderer.invoke('auth-verify-passkey', passkey),
    setupOwner: (payload) => {
      if (!payload || typeof payload !== 'object') throw new TypeError('payload must be an object')
      return ipcRenderer.invoke('auth-setup-owner', payload)
    },
    setPasskey: (passkey) => ipcRenderer.invoke('auth-set-passkey', passkey),
  },
  
  // Store operations via IPC
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
  },
  
  // Offline database operations
  offline: {
    getProducts: (vendorId) => ipcRenderer.invoke('offline-get-products', vendorId),
    getProductByBarcode: (barcode) => ipcRenderer.invoke('offline-get-product-by-barcode', barcode),
    getProductByRfidTag: (tagId) => ipcRenderer.invoke('offline-get-product-by-rfid', tagId),
    saveSale: (sale) => ipcRenderer.invoke('offline-save-sale', sale),
    getCustomers: (vendorId) => ipcRenderer.invoke('offline-get-customers', vendorId),
    getStats: () => ipcRenderer.invoke('offline-get-stats'),
    syncNow: () => ipcRenderer.invoke('offline-sync-now'),
    downloadData: (vendorId) => ipcRenderer.invoke('offline-download-data', vendorId),
  },
  
  // Printing operations
  print: {
    receipt: (receiptData) => ipcRenderer.invoke('print-receipt', receiptData),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printProductLabels: (options) => ipcRenderer.invoke('print-product-labels', options),
    printHtml: (options) => ipcRenderer.invoke('print-html', options),
  },

  /** Invoice PDF bytes via Chromium printToPDF (no OS print dialog). */
  invoiceHtmlToPdf: (options) => ipcRenderer.invoke('invoice-html-to-pdf', options),

  /** Save backup JSON to a path (folder/USB) via system dialog — desktop only. */
  saveBackupToFile: (content, defaultFilename) =>
    ipcRenderer.invoke('save-backup-to-file', { content, defaultFilename }),
  
  // Barcode scanner
  scanner: {
    onBarcodeScanned: (callback) => ipcRenderer.on('barcode-scanned', (event, barcode) => callback(barcode)),
    listPorts: () => ipcRenderer.invoke('scanner-list-ports'),
    connectSerial: (portPath, baudRate) => ipcRenderer.invoke('scanner-connect-serial', portPath, baudRate),
  },

  // RFID (keyboard wedge + dashboard store)
  rfid: {
    onRfidScanned: (callback) => ipcRenderer.on('rfid-scanned', (event, tagId) => callback(tagId)),
    onEventsBatch: (callback) => ipcRenderer.on('rfid-events-batch', (event, events) => callback(events)),
    getRecentEvents: (limit) => ipcRenderer.invoke('rfid-get-recent-events', limit),
    getAlerts: (opts) => ipcRenderer.invoke('rfid-get-alerts', opts),
    ackAlert: (alertId) => ipcRenderer.invoke('rfid-ack-alert', alertId),
    getReaders: () => ipcRenderer.invoke('rfid-get-readers'),
    addReader: (data) => ipcRenderer.invoke('rfid-add-reader', data),
    deleteReader: (id) => ipcRenderer.invoke('rfid-delete-reader', id),
    getEventsByTag: (tagId, limit) => ipcRenderer.invoke('rfid-get-events-by-tag', tagId, limit),
    addUnknownTagAlert: (tagId, readerId) => ipcRenderer.invoke('rfid-add-unknown-tag-alert', tagId, readerId),
    listPorts: () => ipcRenderer.invoke('scanner-list-ports'),
    connectSerial: (portPath, baudRate) => ipcRenderer.invoke('scanner-connect-serial', portPath, baudRate),
  },
  
  // Auto-updater
  updater: {
    check: () => ipcRenderer.invoke('updater-check'),
    download: () => ipcRenderer.invoke('updater-download'),
    install: () => ipcRenderer.invoke('updater-install'),
    getChannel: () => ipcRenderer.invoke('updater-get-channel'),
    setChannel: (channel) => ipcRenderer.invoke('updater-set-channel', channel),
    onStatus: (callback) => {
      const handler = (_event, status) => callback(status)
      ipcRenderer.on('update-status', handler)
      return () => ipcRenderer.removeListener('update-status', handler)
    },
    onUpdateAvailable: (callback) => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('update-available', handler)
      return () => ipcRenderer.removeListener('update-available', handler)
    },
    onProgress: (callback) => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('update-progress', handler)
      return () => ipcRenderer.removeListener('update-progress', handler)
    },
    onDownloaded: (callback) => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('update-downloaded', handler)
      return () => ipcRenderer.removeListener('update-downloaded', handler)
    },
    startDownload: () => ipcRenderer.send('start-update'),
    installUpdate: () => ipcRenderer.send('install-update'),
    remindLater: () => ipcRenderer.send('remind-later'),
  },

  appWindow: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close: () => ipcRenderer.invoke('window-close-app'),
    isFullscreen: () => ipcRenderer.invoke('window-is-fullscreen'),
    onFullscreenChange: (callback) => {
      const handler = (_event, isFullscreen) => callback(Boolean(isFullscreen))
      ipcRenderer.on('window-fullscreen-change', handler)
      return () => ipcRenderer.removeListener('window-fullscreen-change', handler)
    },
    minimizeSend: () => ipcRenderer.send('window-minimize'),
    closeSend: () => ipcRenderer.send('window-close-app'),
  },
  
  // Keyboard shortcut listeners
  shortcuts: {
    onHelp: (callback) => ipcRenderer.on('shortcut-help', callback),
    onNewSale: (callback) => ipcRenderer.on('shortcut-new-sale', callback),
    onSearch: (callback) => ipcRenderer.on('shortcut-search', callback),
    onCustomer: (callback) => ipcRenderer.on('shortcut-customer', callback),
    onRefresh: (callback) => ipcRenderer.on('shortcut-refresh', callback),
    onDiscount: (callback) => ipcRenderer.on('shortcut-discount', callback),
    onPaymentCash: (callback) => ipcRenderer.on('shortcut-payment-cash', callback),
    onPaymentCard: (callback) => ipcRenderer.on('shortcut-payment-card', callback),
    onPrintReceipt: (callback) => ipcRenderer.on('shortcut-print-receipt', callback),
    onCancel: (callback) => ipcRenderer.on('shortcut-cancel', callback),
    onPrint: (callback) => ipcRenderer.on('shortcut-print', callback),
    onBarcode: (callback) => ipcRenderer.on('shortcut-barcode', callback),
    // Remove listeners
    removeAll: () => {
      const channels = [
        'shortcut-help', 'shortcut-new-sale', 'shortcut-search',
        'shortcut-customer', 'shortcut-refresh', 'shortcut-discount',
        'shortcut-payment-cash', 'shortcut-payment-card', 'shortcut-print-receipt',
        'shortcut-cancel', 'shortcut-print', 'shortcut-barcode'
      ]
      channels.forEach(channel => ipcRenderer.removeAllListeners(channel))
    }
  }
})

// Dedicated updater bridge for minimal and explicit renderer integration.
contextBridge.exposeInMainWorld('updater', {
  onUpdateAvailable: (cb) => {
    const handler = (_event, payload) => cb(payload)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },
  onProgress: (cb) => {
    const handler = (_event, payload) => cb(payload)
    ipcRenderer.on('update-progress', handler)
    return () => ipcRenderer.removeListener('update-progress', handler)
  },
  onDownloaded: (cb) => {
    const handler = (_event, payload) => cb(payload)
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },
  startDownload: () => ipcRenderer.send('start-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  remindLater: () => ipcRenderer.send('remind-later'),
})
