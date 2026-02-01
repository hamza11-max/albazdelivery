const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  getName: () => ipcRenderer.invoke('app-name'),
  platform: process.platform,
  isElectron: true,
  
  // Auth-related IPC
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth-login', credentials),
    logout: () => ipcRenderer.invoke('auth-logout'),
    checkAuth: () => ipcRenderer.invoke('auth-check'),
    getToken: () => ipcRenderer.invoke('auth-get-token'),
    getUser: () => ipcRenderer.invoke('auth-get-user'),
    getSetup: () => ipcRenderer.invoke('auth-get-setup'),
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
  },
  
  // Barcode scanner
  scanner: {
    onBarcodeScanned: (callback) => ipcRenderer.on('barcode-scanned', (event, barcode) => callback(barcode)),
    listPorts: () => ipcRenderer.invoke('scanner-list-ports'),
    connectSerial: (portPath, baudRate) => ipcRenderer.invoke('scanner-connect-serial', portPath, baudRate),
  },
  
  // Auto-updater
  updater: {
    check: () => ipcRenderer.invoke('updater-check'),
    download: () => ipcRenderer.invoke('updater-download'),
    install: () => ipcRenderer.invoke('updater-install'),
    onStatus: (callback) => ipcRenderer.on('update-status', (event, status) => callback(status)),
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
