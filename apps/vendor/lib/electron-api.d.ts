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

interface ElectronRfidAPI {
  onRfidScanned: (callback: (tagId: string) => void) => void
}

interface ElectronScannerAPI {
  onBarcodeScanned: (callback: (barcode: string) => void) => void
  listPorts: () => Promise<Array<{ path: string; manufacturer?: string }>>
  connectSerial: (portPath: string, baudRate?: number) => Promise<{ success: boolean }>
}

interface ElectronAPI {
  getVersion: () => Promise<string>
  getName: () => Promise<string>
  platform: NodeJS.Platform
  isElectron: boolean
  auth: ElectronAuthAPI
  store: ElectronStoreAPI
  offline: ElectronOfflineAPI
  print: ElectronPrintAPI
  shortcuts: ElectronShortcutsAPI
  rfid?: ElectronRfidAPI
  scanner?: ElectronScannerAPI
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
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
  ReceiptData,
  PrinterInfo
}

