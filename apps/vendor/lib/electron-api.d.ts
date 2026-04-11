/**
 * TypeScript declarations for Electron API exposed via preload
 */

interface ElectronAuthAPI {
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  checkAuth: () => Promise<{ isAuthenticated: boolean; user: any | null }>
  getSetup: () => Promise<{ setupComplete: boolean; ownerProfile?: any; shopType?: string }>
  getShopType: () => Promise<string>
  setShopType: (shopType: string) => Promise<{ success: boolean; shopType?: string; error?: string }>
  verifyPasskey: (passkey: string) => Promise<{ success: boolean; error?: string }>
  setupOwner: (payload: { name: string; phone: string; email: string; password: string }) => Promise<{ success: boolean; error?: string; alreadyComplete?: boolean }>
}

interface ElectronStoreAPI {
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<boolean>
  delete: (key: string) => Promise<boolean>
}

interface OfflineProduct {
  id: string
  sku?: string
  name: string
  description?: string
  category?: string
  costPrice?: number
  sellingPrice?: number
  stock: number
  lowStockThreshold?: number
  barcode?: string
  image?: string
  vendorId?: string
}

interface OfflineSale {
  id?: string
  items: Array<{
    productId?: string
    productName: string
    quantity: number
    price: number
    discount?: number
  }>
  subtotal: number
  discount?: number
  tax?: number
  total: number
  paymentMethod: string
  customerId?: string
  vendorId?: string
}

interface OfflineCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  vendorId?: string
}

interface OfflineStats {
  products: number
  sales: number
  pendingSales: number
  customers: number
  pendingSyncItems: number
}

interface ElectronOfflineAPI {
  getProducts: (vendorId?: string) => Promise<OfflineProduct[]>
  getProductByBarcode: (barcode: string) => Promise<OfflineProduct | null>
  getProductByRfidTag: (tagId: string) => Promise<OfflineProduct | null>
  saveSale: (sale: OfflineSale) => Promise<any>
  getCustomers: (vendorId?: string) => Promise<OfflineCustomer[]>
  getStats: () => Promise<OfflineStats>
  syncNow: () => Promise<OfflineStats>
  downloadData: (vendorId?: string) => Promise<OfflineStats>
}

interface ReceiptData {
  storeName?: string
  orderNumber?: string
  date?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  discount?: number
  tax?: number
  total: number
  paymentMethod?: string
  shopAddress?: string
  shopPhone?: string
  shopEmail?: string
  shopCity?: string
  /** Windows printer name from Sync & backup settings; optional */
  deviceName?: string
}

interface PrinterInfo {
  name: string
  displayName: string
  description?: string
  status: number
  isDefault: boolean
}

interface ElectronPrintAPI {
  receipt: (receiptData: ReceiptData) => Promise<{ success: boolean; error?: string }>
  getPrinters: () => Promise<PrinterInfo[]>
  printProductLabels: (options: {
    products: Array<Record<string, unknown>>
    fields?: string[]
    labelType?: string
    widthMm?: number
    heightMm?: number
    shopName?: string
    deviceName?: string
  }) => Promise<{ success: boolean; error?: string }>
  printHtml: (options: {
    html: string
    deviceName?: string
    silent?: boolean
    widthMicrons?: number
    heightMicrons?: number
  }) => Promise<{ success: boolean; error?: string }>
}

type ShortcutCallback = () => void

interface ElectronShortcutsAPI {
  onHelp: (callback: ShortcutCallback) => void
  onNewSale: (callback: ShortcutCallback) => void
  onSearch: (callback: ShortcutCallback) => void
  onCustomer: (callback: ShortcutCallback) => void
  onRefresh: (callback: ShortcutCallback) => void
  onDiscount: (callback: ShortcutCallback) => void
  onPaymentCash: (callback: ShortcutCallback) => void
  onPaymentCard: (callback: ShortcutCallback) => void
  onPrintReceipt: (callback: ShortcutCallback) => void
  onCancel: (callback: ShortcutCallback) => void
  onPrint: (callback: ShortcutCallback) => void
  onBarcode: (callback: ShortcutCallback) => void
  removeAll: () => void
}

export interface RfidReadEvent {
  id: string
  tagId: string
  readerId: string
  gateId: string | null
  zoneId: string | null
  timestamp: string
  direction: string
}

export interface RfidReader {
  id: string
  name: string
  type: 'keyboard' | 'serial' | 'gate'
  serialPath: string | null
  baudRate: number
  zoneId: string | null
  lastSeenAt: string | null
  status: 'online' | 'offline' | 'error'
}

export interface RfidAlert {
  id: string
  type: 'unknown_tag' | 'duplicate_read' | 'zone_mismatch' | 'reader_offline' | 'low_read_rate'
  tagId: string
  readerId: string
  payload: Record<string, unknown>
  createdAt: string
  acknowledged: boolean
}

interface ElectronRfidAPI {
  onRfidScanned: (callback: (tagId: string) => void) => void
  onEventsBatch: (callback: (events: RfidReadEvent[]) => void) => void
  getRecentEvents: (limit?: number) => Promise<RfidReadEvent[]>
  getAlerts: (opts?: { acknowledged?: boolean }) => Promise<RfidAlert[]>
  ackAlert: (alertId: string) => Promise<boolean>
  getReaders: () => Promise<RfidReader[]>
  addReader: (data: { name?: string; type?: string; serialPath?: string | null; baudRate?: number; zoneId?: string | null }) => Promise<RfidReader>
  deleteReader: (id: string) => Promise<boolean>
  getEventsByTag: (tagId: string, limit?: number) => Promise<RfidReadEvent[]>
  addUnknownTagAlert: (tagId: string, readerId?: string) => Promise<void>
  listPorts: () => Promise<Array<{ path: string; manufacturer?: string; serialNumber?: string; vendorId?: string; productId?: string }>>
  connectSerial: (portPath: string, baudRate?: number) => Promise<{ success: boolean }>
}

interface ElectronScannerAPI {
  onBarcodeScanned: (callback: (barcode: string) => void) => void
  listPorts: () => Promise<Array<{ path: string; manufacturer?: string }>>
  connectSerial: (portPath: string, baudRate?: number) => Promise<{ success: boolean }>
}

export interface AppUpdateStatusPayload {
  status: 'checking' | 'available' | 'not-available' | 'error' | 'downloading' | 'downloaded'
  version?: string
  releaseDate?: string
  message?: string
  percent?: number
  transferred?: number
  total?: number
  bytesPerSecond?: number
}

interface ElectronUpdaterAPI {
  check: () => Promise<{ available?: boolean; info?: { version?: string }; message?: string; error?: string }>
  download: () => Promise<{ success?: boolean; error?: string }>
  install: () => Promise<void>
  startDownload: () => void
  installUpdate: () => void
  remindLater: () => void
  getChannel: () => Promise<{ channel: 'latest' | 'beta' }>
  setChannel: (channel: 'latest' | 'beta') => Promise<{ success?: boolean; channel?: 'latest' | 'beta'; error?: string }>
  onStatus: (callback: (payload: AppUpdateStatusPayload) => void) => () => void
  onUpdateAvailable: (callback: (payload: { version?: string; releaseDate?: string }) => void) => () => void
  onProgress: (callback: (payload: { percent?: number; transferred?: number; total?: number; bytesPerSecond?: number }) => void) => () => void
  onDownloaded: (callback: (payload: { version?: string; releaseDate?: string }) => void) => () => void
}

interface RendererUpdaterAPI {
  onUpdateAvailable: (callback: (payload: { version?: string; releaseDate?: string }) => void) => () => void
  onProgress: (callback: (payload: { percent?: number; transferred?: number; total?: number; bytesPerSecond?: number }) => void) => () => void
  onDownloaded: (callback: (payload: { version?: string; releaseDate?: string }) => void) => () => void
  startDownload: () => void
  installUpdate: () => void
  remindLater: () => void
}

interface ElectronAPI {
  getVersion: () => Promise<string>
  getName: () => Promise<string>
  getHealth: () => Promise<{ ok?: boolean; modules?: { autoUpdater?: boolean }; env?: { isDev?: boolean; appVersion?: string } }>
  platform: NodeJS.Platform
  isElectron: boolean
  updater?: ElectronUpdaterAPI
  auth: ElectronAuthAPI
  store: ElectronStoreAPI
  offline: ElectronOfflineAPI
  print: ElectronPrintAPI
  shortcuts: ElectronShortcutsAPI
  rfid?: ElectronRfidAPI
  scanner?: ElectronScannerAPI
  invoiceHtmlToPdf?: (options: { html?: string; title?: string }) => Promise<{ ok?: boolean; error?: string; data?: Uint8Array }>
  saveBackupToFile?: (content: string, defaultFilename?: string) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string; error?: string }>
  appWindow?: {
    minimize: () => Promise<{ success?: boolean }>
    close: () => Promise<{ success?: boolean }>
    minimizeSend?: () => void
    closeSend?: () => void
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
    updater?: RendererUpdaterAPI
  }
}

export type {
  ElectronAPI,
  ElectronAuthAPI,
  ElectronStoreAPI,
  ElectronOfflineAPI,
  ElectronPrintAPI,
  ElectronShortcutsAPI,
  OfflineProduct,
  OfflineSale,
  OfflineCustomer,
  OfflineStats,
  AppUpdateStatusPayload,
  ReceiptData,
  PrinterInfo
}

