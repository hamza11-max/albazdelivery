const { contextBridge, ipcRenderer } = require('electron')

// Minimal, validated bridge between renderer and main process.
// Only expose a small allowlist of safe operations. All event listeners
// return an unsubscribe function and the API validates argument shapes.

function assertString(name, v) {
  if (typeof v !== 'string') throw new TypeError(`${name} must be a string`)
}

function assertFunction(name, v) {
  if (typeof v !== 'function') throw new TypeError(`${name} must be a function`)
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform || 'unknown',

  app: {
    getVersion: () => ipcRenderer.invoke('app-version'),
    getName: () => ipcRenderer.invoke('app-name'),
  },

  auth: {
    login: (credentials) => {
      if (!credentials || typeof credentials !== 'object') throw new TypeError('credentials must be an object')
      return ipcRenderer.invoke('auth-login', credentials)
    },
    logout: () => ipcRenderer.invoke('auth-logout'),
    checkAuth: () => ipcRenderer.invoke('auth-check'),
    getToken: () => ipcRenderer.invoke('auth-get-token'),
    getUser: () => ipcRenderer.invoke('auth-get-user'),
  },

  store: {
    get: (key) => {
      assertString('store.get key', key)
      return ipcRenderer.invoke('store-get', key)
    },
    set: (key, value) => {
      assertString('store.set key', key)
      if (value === undefined) throw new TypeError('store.set value cannot be undefined')
      return ipcRenderer.invoke('store-set', key, value)
    },
    delete: (key) => {
      assertString('store.delete key', key)
      return ipcRenderer.invoke('store-delete', key)
    },
  },

  offline: {
    getProducts: (vendorId) => {
      if (typeof vendorId !== 'string' && typeof vendorId !== 'number') throw new TypeError('vendorId must be string or number')
      return ipcRenderer.invoke('offline-get-products', vendorId)
    },
    getProductByBarcode: (barcode) => {
      assertString('barcode', barcode)
      return ipcRenderer.invoke('offline-get-product-by-barcode', barcode)
    },
    saveSale: (sale) => {
      if (!sale || typeof sale !== 'object') throw new TypeError('sale must be an object')
      return ipcRenderer.invoke('offline-save-sale', sale)
    },
    getCustomers: (vendorId) => {
      if (typeof vendorId !== 'string' && typeof vendorId !== 'number') throw new TypeError('vendorId must be string or number')
      return ipcRenderer.invoke('offline-get-customers', vendorId)
    },
    getStats: () => ipcRenderer.invoke('offline-get-stats'),
    syncNow: () => ipcRenderer.invoke('offline-sync-now'),
    downloadData: (vendorId) => {
      if (typeof vendorId !== 'string' && typeof vendorId !== 'number') throw new TypeError('vendorId must be string or number')
      return ipcRenderer.invoke('offline-download-data', vendorId)
    },
  },

  print: {
    receipt: (receiptData) => {
      if (!receiptData || typeof receiptData !== 'object') throw new TypeError('receiptData must be an object')
      return ipcRenderer.invoke('print-receipt', receiptData)
    },
    getPrinters: () => ipcRenderer.invoke('get-printers'),
  },

  scanner: {
    listPorts: () => ipcRenderer.invoke('scanner-list-ports'),
    connectSerial: (portPath, baudRate) => {
      assertString('portPath', portPath)
      if (baudRate !== undefined && typeof baudRate !== 'number') throw new TypeError('baudRate must be a number')
      return ipcRenderer.invoke('scanner-connect-serial', portPath, baudRate)
    },
    onBarcodeScanned: (callback) => {
      assertFunction('onBarcodeScanned callback', callback)
      const listener = (event, barcode) => { try { callback(barcode) } catch (e) { console.error('barcode callback error', e) } }
      ipcRenderer.on('barcode-scanned', listener)
      return () => ipcRenderer.removeListener('barcode-scanned', listener)
    }
  },

  updater: {
    check: () => ipcRenderer.invoke('updater-check'),
    download: () => ipcRenderer.invoke('updater-download'),
    install: () => ipcRenderer.invoke('updater-install'),
    onStatus: (callback) => {
      assertFunction('updater.onStatus callback', callback)
      const listener = (event, status) => { try { callback(status) } catch (e) { console.error('updater callback error', e) } }
      ipcRenderer.on('update-status', listener)
      return () => ipcRenderer.removeListener('update-status', listener)
    }
  },

  shortcuts: {
    on: (name, callback) => {
      assertString('shortcut name', name)
      assertFunction('shortcut callback', callback)
      const channel = `shortcut-${name}`
      const listener = (event, ...args) => { try { callback(...args) } catch (e) { console.error('shortcut callback error', e) } }
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    removeAll: () => {
      // remove listeners for known shortcut channels
      const channels = [
        'shortcut-help', 'shortcut-new-sale', 'shortcut-search',
        'shortcut-customer', 'shortcut-refresh', 'shortcut-discount',
        'shortcut-payment-cash', 'shortcut-payment-card', 'shortcut-print-receipt',
        'shortcut-cancel', 'shortcut-print', 'shortcut-barcode'
      ]
      channels.forEach(ch => ipcRenderer.removeAllListeners(ch))
    }
  }
})
