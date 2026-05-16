"use client"

import { useState, useEffect, useMemo, useRef, useCallback, FormEvent, Suspense } from "react"
import type { ChangeEvent } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { playSuccessSound } from "@/root/lib/notifications"
import { 
  AlertTriangle,
  BarChart3,
  Upload,
  ScanLine,
  DollarSign,
  Edit,
  History,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  HelpCircle,
  Sparkles,
  X,
  Percent,
  Calculator,
  CreditCard,
  Wallet,
  RotateCcw,
  LogOut,
  CheckCircle2,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag,
  Cable
} from "lucide-react"

// UI Components
import { Button } from "@/root/components/ui/button"
import { useToast } from "@/root/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Textarea } from "@/root/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import ElectronLogin from "@/root/components/ElectronLogin"
import { POSView } from "../../components/POSView"
import { ProductDialog } from "../../components/dialogs/ProductDialog"
import { CustomerDialog } from "../../components/dialogs/CustomerDialog"
import { SupplierDialog } from "../../components/dialogs/SupplierDialog"
import { DashboardTab } from "../../components/tabs/DashboardTab"
import { InventoryTab } from "../../components/tabs/InventoryTab"
import { OrdersTab } from "../../components/tabs/OrdersTab"
import { KitchenTab } from "../../components/tabs/KitchenTab"
import { DineQrTab } from "../../components/tabs/DineQrTab"
import { AccountingTab } from "../../components/tabs/AccountingTab"
import { DriversTab } from "../../components/tabs/DriversTab"
import { SalesTab } from "../../components/tabs/SalesTab"
import { SuppliersTab } from "../../components/tabs/SuppliersTab"
import { AITab } from "../../components/tabs/AITab"
import { ReportsTab } from "../../components/tabs/ReportsTab"
import { CouponsTab } from "../../components/tabs/CouponsTab"
import { SyncSaveTab } from "../../components/tabs/SyncSaveTab"
import { EmailTab } from "../../components/tabs/EmailTab"
import { StaffPermissionsTab } from "../../components/tabs/StaffPermissionsTab"
import { ClientsLoyaltyTab } from "../../components/tabs/ClientsLoyaltyTab"
import { RfidDashboardTab } from "../../components/tabs/RfidDashboardTab"
import { BarcodeScannerDialog } from "../../components/dialogs/BarcodeScannerDialog"
import { SaleSuccessDialog } from "../../components/dialogs/SaleSuccessDialog"
import { ReceiptDialog } from "../../components/dialogs/ReceiptDialog"
import { ImageUploadDialog } from "../../components/dialogs/ImageUploadDialog"
import { ReceiptView } from "../../components/ReceiptView"

// Hooks
// Use custom hooks
import { useAuth } from "@/root/hooks/use-auth"
import { useDashboardData } from "./fetch-data"
import { fetchDashboardData, fetchInventory } from "./refresh-data"
import { usePOSCart } from "../../hooks/usePOSCart"
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner"
import { saveProduct, deleteProduct, postProductToDelivery } from "../../utils/productUtils"
import { saveCustomer } from "../../utils/customerUtils"
import { saveSupplier } from "../../utils/supplierUtils"
import { assignOrderDriver, updateOrderStatus } from "../../utils/orderUtils"
import { completeSale as completeSaleUtil } from "../../utils/saleUtils"
import {
  getVendorPrinterDevice,
  VENDOR_PRINTER_LABEL_KEY,
  VENDOR_PRINTER_POS_KEY,
} from "../../utils/printerSettings"
import { resetProductForm, resetCustomerForm } from "../../utils/formUtils"
import { handleFileUpload as handleFileUploadUtil } from "../../utils/fileUtils"
import { handleDataLoad as handleDataLoadUtil } from "../../utils/dataUtils"
import {
  fetchDrivers as fetchDriversUtil,
  respondToDriverRequest as respondToDriverRequestUtil,
  inviteVendorDriver as inviteVendorDriverUtil,
  setDriverDispatchAvailability as setDriverDispatchAvailabilityUtil,
} from "../../utils/driverUtils"
import { fetchAIInsights as fetchAIInsightsUtil } from "../../utils/aiUtils"
import { useDataLoading } from "../../hooks/useDataLoading"
import { usePOSHandlers } from "../../hooks/usePOSHandlers"
import { LoadingScreen } from "@/root/components/LoadingScreen"
import { useVendorState } from "../../hooks/useVendorState"
import { loadElectronOfflineData, getMergedLocalSalesHistory, removeLocalProvisionalSale } from "../../utils/electronUtils"
import { AppUpdateCard } from "../../components/AppUpdateCard"
import { VendorPrinterSettingsCard } from "../../components/VendorPrinterSettingsCard"
import { VendorSecuritySettingsPanel } from "../../components/security/VendorSecuritySettingsPanel"
import { VendorStorefrontWebPanel } from "../../components/VendorStorefrontWebPanel"
import { vendorMenuItems } from "../../components/navigation/vendor-menu-items"
import { NotificationsPanel, type VendorNotificationItem } from "../../components/navigation/NotificationsPanel"
import { StaffSwitchDialog } from "../../components/navigation/StaffSwitchDialog"
import { getTabIdForShortcut, getVendorTabShortcut } from "../../components/navigation/tab-shortcuts"
import {
  getTabsForShopType,
  isSettingsSectionVisible,
  type ShopType,
} from "../../config/shopTypes"
import { getVendorFeatureFlags } from "../../config/vendorFeatures"
import { listAccessibleTabIds } from "../../config/vendorEntitlements"
import { VendorShell } from "../../components/layout/VendorShell"
import { setLightDarkTheme } from "@/root/lib/theme"
import { useSubscription } from "@/root/hooks/useSubscription"
import {
  subscriptionStatusGrantsPlanFeatures,
  PLAN_FEATURES,
} from "@/root/lib/subscription-plans"
import { resolveVendorEntitlements } from "@/root/lib/subscriptions/resolve-entitlements"

// Types
import type {
  InventoryProduct,
  Sale, 
  Customer,
  Supplier,
  Order,
  SaleItem
} from "@/root/lib/types"

import { type Category } from "./types"

import type {
  ApiResponse,
  CartItem,
  CustomerForm,
  ProductForm,
  TopProductData,
  SalesForecast,
  BundleRecommendation,
  InventoryRecommendation,
  LoadingState,
  SupplierForm,
  SalesFilter,
  SalesData,
  CustomersData,
  SuppliersData,
  ProductsData,
  OrdersData,
  CategoriesData
} from "./types"

type FinancePayoutRow = {
  id: string
  period: string
  gross: number
  fees: number
  net: number
  status: string
  eta: string
}

type FinanceDisputeRow = {
  id: string
  payoutId: string
  orderId: string
  reason: string
  amount: number
  status?: string
}

function VendorDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { isAuthenticated, user, isLoading, status } = useAuth()
  const { toast } = useToast()
  const {
    subscription,
    loading: subscriptionLoading,
    refetch: refetchSubscription,
    hasFeature,
  } = useSubscription()
  const [ordersCustomerFilter, setOrdersCustomerFilter] = useState<string | null>(null)
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null)
  
  // All vendor state - using custom hook
  const {
    electronUser,
    setElectronUser,
    electronAuthChecked,
    setElectronAuthChecked,
    isElectronRuntime,
    isDarkMode,
    setIsDarkMode,
    activeTab,
    setActiveTab,
    language,
    setLanguage,
    showProductDialog,
    setShowProductDialog,
    showCustomerDialog,
    setShowCustomerDialog,
    showSupplierDialog,
    setShowSupplierDialog,
    showReceiptDialog,
    setShowReceiptDialog,
    sales,
    setSales,
    customers,
    setCustomers,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    orders,
    setOrders,
    categories,
    setCategories,
    lowStockProducts,
    setLowStockProducts,
    connectedDrivers,
    setConnectedDrivers,
    pendingDriverRequests,
    setPendingDriverRequests,
    loadingDrivers,
    setLoadingDrivers,
    todaySales,
    setTodaySales,
    weekSales,
    setWeekSales,
    monthSales,
    setMonthSales,
    topProducts,
    setTopProducts,
    productForm,
    setProductForm,
    customerForm,
    setCustomerForm,
    supplierForm,
    setSupplierForm,
    salesForecast,
    setSalesForecast,
    inventoryRecommendations,
    setInventoryRecommendations,
    productBundles,
    setProductBundles,
    selectedProductForImage,
    setSelectedProductForImage,
    showImageUploadDialog,
    setShowImageUploadDialog,
    fileInputRef,
    editingProduct,
    setEditingProduct,
    lastSale,
    setLastSale,
    showSaleSuccessDialog,
    setShowSaleSuccessDialog,
    showReceipt,
    setShowReceipt,
    completedSale,
    setCompletedSale,
    isAdmin,
    setIsAdmin,
    availableVendors,
    setAvailableVendors,
    selectedVendorId,
    setSelectedVendorId,
    isLoadingVendors,
    setIsLoadingVendors,
    isArabic,
    translate,
    activeVendorId,
    storeId,
    setStoreId,
    isAcceptingOrders,
    setIsAcceptingOrders,
  } = useVendorState()

  const vendorTabIds = useMemo(
    () =>
      new Set([
        "dashboard",
        "pos",
        "inventory",
        "orders",
        "drivers",
        "sales",
        "reports",
        "coupons",
        "sync-save",
        "email",
        "storefront",
        "staff-permissions",
        "clients-loyalty",
        "suppliers",
        "ai",
        "settings",
        "rfid",
        "menu",
      ]),
    [],
  )

  const queryString = searchParams.toString()
  useEffect(() => {
    const params = new URLSearchParams(queryString)
    const tab = params.get("tab")
    const orderId = params.get("orderId")
    const customerId = params.get("customerId")
    if (tab && vendorTabIds.has(tab)) setActiveTab(tab)
    if (orderId) {
      setActiveTab("orders")
      setHighlightOrderId(orderId)
    }
    if (customerId) {
      setActiveTab("orders")
      setOrdersCustomerFilter(customerId)
    }
  }, [queryString, setActiveTab, vendorTabIds])

  useEffect(() => {
    const onSwitchTab = (e: Event) => {
      const tab = (e as CustomEvent<string>).detail
      if (typeof tab !== "string" || !vendorTabIds.has(tab)) return
      setActiveTab(tab)
      const p = new URLSearchParams(searchParams.toString())
      p.set("tab", tab)
      router.replace(`${pathname}?${p.toString()}`, { scroll: false })
    }
    if (typeof window === "undefined") return
    window.addEventListener("switchTab", onSwitchTab as EventListener)
    return () => window.removeEventListener("switchTab", onSwitchTab as EventListener)
  }, [pathname, router, searchParams, setActiveTab, vendorTabIds])

  const clearOrdersCustomerFilter = useCallback(() => {
    setOrdersCustomerFilter(null)
    const p = new URLSearchParams(searchParams.toString())
    p.delete("customerId")
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const onViewCustomerOrders = useCallback(
    (customerId: string) => {
      setOrdersCustomerFilter(customerId)
      setActiveTab("orders")
      const p = new URLSearchParams(searchParams.toString())
      p.set("tab", "orders")
      p.set("customerId", customerId)
      p.delete("orderId")
      router.replace(`${pathname}?${p.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, setActiveTab],
  )

  // In Electron use electron store user; otherwise NextAuth user
  const effectiveUser = isElectronRuntime ? electronUser : user
  const isLocalOfflineVendor =
    isElectronRuntime &&
    typeof effectiveUser?.id === "string" &&
    (effectiveUser.id.startsWith("local-") || effectiveUser.id.startsWith("electron-"))

  // Redirect unauthenticated web users to /login
  useEffect(() => {
    if (isElectronRuntime) return
    if (isLoading || status === "loading") return
    if (!isAuthenticated || !user) {
      router.replace('/login')
    }
  }, [isElectronRuntime, isLoading, status, isAuthenticated, user, router])

  // Shop type: from Electron store (setup) or default 'other' for web
  const [shopType, setShopType] = useState<ShopType | "other">("other")
  useEffect(() => {
    const auth = (typeof window !== "undefined" && window.electronAPI?.auth) as { getShopType?: () => Promise<string> } | undefined
    if (!auth?.getShopType) return
    auth.getShopType().then((type: string) => {
      if (type && ["restaurant", "retail", "grocery", "other"].includes(type)) {
        setShopType(type as ShopType)
      }
    }).catch(() => {})
  }, [isElectronRuntime])

  const domainVendorId = useMemo(
    () =>
      isAdmin
        ? selectedVendorId ?? null
        : (effectiveUser?.id as string | undefined) ?? null,
    [isAdmin, selectedVendorId, effectiveUser?.id]
  )

  const vendorFeatures = useMemo(() => getVendorFeatureFlags(shopType), [shopType])
  const subscriptionPlanFeatures = useMemo(() => {
    const plan = subscription?.plan || "STARTER"
    const status = subscription?.status || "TRIAL"
    return resolveVendorEntitlements({ plan, status, featureOverrides: null })
  }, [subscription?.plan, subscription?.status])
  const subscriptionGrantsFeatures = useMemo(() => {
    if (!subscription) return true
    return subscriptionStatusGrantsPlanFeatures(subscription.plan, subscription.status)
  }, [subscription])
  const allowedTabIds = useMemo(() => {
    return listAccessibleTabIds({
      shopType,
      vendorFeatures,
      planFeatures: subscriptionPlanFeatures ?? PLAN_FEATURES.STARTER,
      isElectron: isElectronRuntime,
      subscriptionGrantsFeatures,
    })
  }, [
    shopType,
    vendorFeatures,
    subscriptionPlanFeatures,
    isElectronRuntime,
    subscriptionGrantsFeatures,
  ])
  const shortcutItems = useMemo(() => {
    const menuEntry = { id: "menu", labelFr: "Menu rapide", labelAr: "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø³Ø±ÙŠØ¹Ø©" }
    const tabEntries = vendorMenuItems
      .filter((item) => allowedTabIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        labelFr: item.labelFr,
        labelAr: item.labelAr,
      }))
    return [menuEntry, ...tabEntries].map((entry) => ({
      ...entry,
      shortcut: getVendorTabShortcut(entry.id),
    }))
  }, [allowedTabIds])
  useEffect(() => {
    if (activeTab === "menu") return
    if (allowedTabIds.length > 0 && !allowedTabIds.includes(activeTab)) {
      setActiveTab(allowedTabIds[0])
    }
  }, [allowedTabIds, activeTab])

  // Check Electron auth on mount and load offline data
  useEffect(() => {
    if (isElectronRuntime && !electronAuthChecked) {
      window.electronAPI?.auth?.checkAuth?.().then((result: any) => {
        if (result?.isAuthenticated) {
          setElectronUser(result.user)
        }
        setElectronAuthChecked(true)
      }).catch(() => {
        setElectronAuthChecked(true)
      })
      
      // Load all data from localStorage for Electron offline mode
      loadElectronOfflineData({
        setProducts,
        setLowStockProducts,
        setSales,
        setSuppliers,
        setCustomers,
        setTodaySales,
        setWeekSales,
        setMonthSales,
        setTopProducts,
      })
    } else if (!isElectronRuntime) {
      setElectronAuthChecked(true)
    }
  }, [isElectronRuntime, electronAuthChecked, setElectronUser, setElectronAuthChecked, setProducts, setLowStockProducts, setSales, setSuppliers, setCustomers, setTodaySales, setWeekSales, setMonthSales, setTopProducts])

  // Persist and apply dark-mode immediately when toggled
  useEffect(() => {
    try {
      localStorage.setItem('vendor-dark-mode', isDarkMode ? 'true' : 'false')
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [isDarkMode])

  const [settingsSubTab, setSettingsSubTab] = useState("shop")
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState(false)
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(() => {
    if (typeof window === 'undefined') return 20
    const stored = parseInt(localStorage.getItem('vendor-prep-minutes') || '20', 10)
    return Number.isNaN(stored) ? 20 : stored
  })
  const [autoPrintWhatsappOnConfirm, setAutoPrintWhatsappOnConfirm] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("vendor-auto-print-whatsapp-confirm") === "true"
  })
  const [payouts, setPayouts] = useState<FinancePayoutRow[]>([])
  const [disputes, setDisputes] = useState<FinanceDisputeRow[]>([])
  const [disputeForm, setDisputeForm] = useState({ payoutId: '', orderId: '', reason: '', amount: '' })
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false)

  const [offlineQueueCount, setOfflineQueueCount] = useState(() => {
    if (typeof window === 'undefined') return 0
    try {
      const queued = JSON.parse(localStorage.getItem('offline-sales-queue') || '[]')
      return Array.isArray(queued) ? queued.length : 0
    } catch {
      return 0
    }
  })
  const [manualTotal, setManualTotal] = useState<number | null>(null)
  const defaultSchedule = useMemo(() => ([
    { id: "weekday", kind: "weekday", start: "09:00", end: "22:00", enabled: true },
    { id: "weekend", kind: "weekend", start: "10:00", end: "23:00", enabled: true },
  ]), [])
  const [menuSchedule, setMenuSchedule] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('vendor-menu-schedule')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // ignore
    }
    return []
  })
  const [autoPauseOutsideSchedule, setAutoPauseOutsideSchedule] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('vendor-auto-pause') !== 'false'
  })
  const [maxOrdersPerHour, setMaxOrdersPerHour] = useState(() => {
    if (typeof window === 'undefined') return 40
    const stored = Number(localStorage.getItem('vendor-max-orders-hour') || "40")
    return Number.isFinite(stored) && stored > 0 ? stored : 40
  })
  const [recentOrderTimestamps, setRecentOrderTimestamps] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = JSON.parse(localStorage.getItem('vendor-order-timestamps') || '[]')
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  })
  const LABEL_FIELD_OPTIONS = useMemo(() => [
    { id: "sku", labelFr: "SKU", labelAr: "Ø§Ù„Ø±Ù…Ø²" },
    { id: "name", labelFr: "Nom", labelAr: "Ø§Ù„Ø§Ø³Ù…" },
    { id: "price", labelFr: "Prix", labelAr: "Ø§Ù„Ø³Ø¹Ø±" },
    { id: "barcode", labelFr: "Code-barres", labelAr: "Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯" },
    { id: "category", labelFr: "CatÃ©gorie", labelAr: "Ø§Ù„ÙØ¦Ø©" },
    { id: "rfid", labelFr: "RFID", labelAr: "RFID" },
    { id: "shopname", labelFr: "Nom du magasin", labelAr: "Ø§Ø³Ù… Ø§Ù„Ù…ØªØ¬Ø±" },
  ], [])
  const [labelFields, setLabelFields] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['name', 'price', 'sku']
    try {
      const stored = JSON.parse(localStorage.getItem('vendor-label-fields') || '["name","price","sku"]')
      return Array.isArray(stored) ? stored : ['name', 'price', 'sku']
    } catch {
      return ['name', 'price', 'sku']
    }
  })
  const [labelType, setLabelType] = useState<'rfid' | 'normal'>(() => {
    if (typeof window === 'undefined') return 'normal'
    return (localStorage.getItem('vendor-label-type') || 'normal') as 'rfid' | 'normal'
  })
  const [labelWidthMm, setLabelWidthMm] = useState<number>(() => {
    if (typeof window === 'undefined') return 60
    const v = parseInt(localStorage.getItem('vendor-label-width-mm') || '60', 10)
    return Number.isFinite(v) && v >= 20 && v <= 200 ? v : 60
  })
  const [labelHeightMm, setLabelHeightMm] = useState<number>(() => {
    if (typeof window === 'undefined') return 40
    const v = parseInt(localStorage.getItem('vendor-label-height-mm') || '40', 10)
    return Number.isFinite(v) && v >= 15 && v <= 150 ? v : 40
  })
  useEffect(() => {
    try {
      localStorage.setItem('vendor-label-fields', JSON.stringify(labelFields))
      localStorage.setItem('vendor-label-type', labelType)
      localStorage.setItem('vendor-label-width-mm', String(labelWidthMm))
      localStorage.setItem('vendor-label-height-mm', String(labelHeightMm))
    } catch {
      // ignore
    }
  }, [labelFields, labelType, labelWidthMm, labelHeightMm])

  // Serial port (Electron): scanner / RFID serial device
  type SerialPortInfo = { path: string; manufacturer?: string; serialNumber?: string; vendorId?: string; productId?: string }
  const [serialPortsList, setSerialPortsList] = useState<SerialPortInfo[]>([])
  const [loadingSerialPorts, setLoadingSerialPorts] = useState(false)
  const [selectedSerialPort, setSelectedSerialPort] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('vendor-serial-port') || ''
  })
  const [serialBaudRate, setSerialBaudRate] = useState<number>(() => {
    if (typeof window === 'undefined') return 9600
    const v = parseInt(localStorage.getItem('vendor-serial-baud') || '9600', 10)
    return [9600, 19200, 38400, 115200].includes(v) ? v : 9600
  })
  useEffect(() => {
    try {
      localStorage.setItem('vendor-serial-port', selectedSerialPort)
      localStorage.setItem('vendor-serial-baud', String(serialBaudRate))
    } catch {
      // ignore
    }
  }, [selectedSerialPort, serialBaudRate])
  const refreshSerialPorts = useCallback(async () => {
    if (!isElectronRuntime || !(window as any).electronAPI?.scanner?.listPorts) return
    setLoadingSerialPorts(true)
    try {
      const ports = await (window as any).electronAPI.scanner.listPorts()
      setSerialPortsList(Array.isArray(ports) ? ports : [])
    } catch {
      setSerialPortsList([])
    } finally {
      setLoadingSerialPorts(false)
    }
  }, [isElectronRuntime])
  useEffect(() => {
    if (isElectronRuntime && activeTab === 'settings') refreshSerialPorts()
  }, [isElectronRuntime, activeTab, refreshSerialPorts])
  const handleSerialPortChange = useCallback(async (portPath: string) => {
    setSelectedSerialPort(portPath)
    if (!portPath) return
    const api = (window as any).electronAPI
    if (!api?.scanner?.connectSerial) return
    try {
      const res = await api.scanner.connectSerial(portPath, serialBaudRate)
      if (res?.success) toast({ title: translate("Port sÃ©rie", "Ø§Ù„Ù…Ù†ÙØ° Ø§Ù„ØªØ³Ù„Ø³Ù„ÙŠ"), description: translate("ConnectÃ©", "Ù…ØªØµÙ„") })
      else toast({ title: translate("Erreur", "Ø®Ø·Ø£"), description: translate("Ã‰chec de la connexion au port", "ÙØ´Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ù…Ù†ÙØ°"), variant: "destructive" })
    } catch (e: any) {
      toast({ title: translate("Erreur", "Ø®Ø·Ø£"), description: e?.message || translate("Ã‰chec de la connexion", "ÙØ´Ù„ Ø§Ù„Ø§ØªØµØ§Ù„"), variant: "destructive" })
    }
  }, [serialBaudRate, toast, translate])
  const handleSerialBaudChange = useCallback((baud: number) => {
    setSerialBaudRate(baud)
    if (!selectedSerialPort) return
    const api = (window as any).electronAPI
    if (!api?.scanner?.connectSerial) return
    api.scanner.connectSerial(selectedSerialPort, baud).then((res: any) => {
      if (res?.success) toast({ title: translate("Vitesse mise Ã  jour", "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø³Ø±Ø¹Ø©"), description: `${baud} baud` })
      else toast({ title: translate("Erreur", "Ø®Ø·Ø£"), variant: "destructive" })
    }).catch(() => toast({ title: translate("Erreur", "Ø®Ø·Ø£"), variant: "destructive" }))
  }, [selectedSerialPort, toast, translate])
  const BAUD_OPTIONS = [9600, 19200, 38400, 115200]
  const [staffRole, setStaffRole] = useState<"owner" | "manager" | "cashier">(() => {
    if (typeof window === "undefined") return "owner"
    const stored = localStorage.getItem("vendor-staff-role")
    if (stored === "manager" || stored === "cashier" || stored === "owner") return stored
    return "owner"
  })
  const [staffAccounts, setStaffAccounts] = useState<any[]>([])
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "cashier",
    password: "",
    confirmPassword: "",
    pin: "",
    staffCode: "",
  })
  const [staffPinResetOpen, setStaffPinResetOpen] = useState(false)
  const [staffPinResetTarget, setStaffPinResetTarget] = useState<any | null>(null)
  const [showStaffSwitchDialog, setShowStaffSwitchDialog] = useState(false)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [isElectronFullscreen, setIsElectronFullscreen] = useState(false)
  const [notifications, setNotifications] = useState<VendorNotificationItem[]>([])
  const [shopInfo, setShopInfo] = useState(() => {
    if (typeof window === "undefined") {
      return { name: "", phone: "", email: "", address: "", description: "", logo: "", cover: "" }
    }
    try {
      const stored = localStorage.getItem("vendor-shop-info")
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return { name: "", phone: "", email: "", address: "", description: "", logo: "", cover: "" }
  })
  const featureFlags = useMemo(() => ({
    orderPause: true,
    prepTimeEta: true,
    payoutStub: true,
    offlineQueue: true,
  }), [])

  useEffect(() => {
    if (menuSchedule.length === 0) {
      setMenuSchedule(defaultSchedule)
    }
  }, [menuSchedule.length, defaultSchedule])

  useEffect(() => {
    try {
      localStorage.setItem('vendor-menu-schedule', JSON.stringify(menuSchedule))
    } catch {
      // ignore storage errors
    }
  }, [menuSchedule])

  useEffect(() => {
    try {
      localStorage.setItem('vendor-auto-pause', autoPauseOutsideSchedule ? 'true' : 'false')
    } catch {
      // ignore
    }
  }, [autoPauseOutsideSchedule])

  useEffect(() => {
    try {
      localStorage.setItem('vendor-max-orders-hour', String(maxOrdersPerHour || 0))
    } catch {
      // ignore
    }
  }, [maxOrdersPerHour])

  useEffect(() => {
    try {
      localStorage.setItem('vendor-order-timestamps', JSON.stringify(recentOrderTimestamps))
    } catch {
      // ignore
    }
  }, [recentOrderTimestamps])

  useEffect(() => {
    try {
      localStorage.setItem("vendor-staff-role", staffRole)
    } catch {
      // ignore
    }
  }, [staffRole])

  const hashLocalPassword = useCallback(async (password: string, salt: string) => {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    )
    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-512",
      },
      keyMaterial,
      512
    )
    const bytes = new Uint8Array(derived)
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
  }, [])

  const pushNotification = useCallback((title: string, description: string) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        description,
        createdAt: Date.now(),
        read: false,
      },
      ...prev,
    ].slice(0, 80))
  }, [])

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  )

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }, [])

  const handleLogoutAction = useCallback(async () => {
    if (isElectronRuntime) {
      ;(window as any).electronAPI?.appWindow?.close?.()
      return
    }
    await signOut({ callbackUrl: "/login" })
  }, [isElectronRuntime])

  const handleMinimizeApp = useCallback(async () => {
    const appWindow = (window as any).electronAPI?.appWindow
    if (!appWindow) return
    try {
      const result = await appWindow.minimize?.()
      if (!result?.success) {
        appWindow.minimizeSend?.()
      }
    } catch {
      appWindow.minimizeSend?.()
    }
  }, [])

  useEffect(() => {
    if (!isElectronRuntime) return
    const appWindow = (window as any)?.electronAPI?.appWindow
    let cleanup: (() => void) | undefined

    appWindow?.isFullscreen?.()
      ?.then((value: boolean) => setIsElectronFullscreen(Boolean(value)))
      .catch(() => undefined)

    if (appWindow?.onFullscreenChange) {
      cleanup = appWindow.onFullscreenChange((value: boolean) => {
        setIsElectronFullscreen(Boolean(value))
      })
    }

    return () => {
      cleanup?.()
    }
  }, [isElectronRuntime])

  const handleSwitchStaff = useCallback(async (staffCodeInput: string, pinInput: string) => {
    if (!staffCodeInput || !pinInput) {
      return { ok: false, error: translate("Code staff et PIN requis.", "Ø±Ù…Ø² Ø§Ù„Ù…ÙˆØ¸Ù ÙˆPIN Ù…Ø·Ù„ÙˆØ¨Ø§Ù†.") }
    }
    const normalizedCode = staffCodeInput.replace(/\D/g, "").slice(0, 4)
    const account = staffAccounts.find((acc) => String(acc.staffCode || "").trim() === normalizedCode)
    if (!account) {
      return { ok: false, error: translate("Staff introuvable.", "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ¸Ù.") }
    }
    if (!account.pinHash || !account.pinSalt) {
      return { ok: false, error: translate("Ce compte n'a pas de PIN actif.", "Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ PIN Ù†Ø´Ø·.") }
    }
    const attemptedHash = await hashLocalPassword(pinInput, account.pinSalt)
    if (attemptedHash !== account.pinHash) {
      return { ok: false, error: translate("PIN incorrect.", "PIN ØºÙŠØ± ØµØ­ÙŠØ­.") }
    }
    const role = account.role === "manager" || account.role === "cashier" ? account.role : "owner"
    setStaffRole(role)
    pushNotification(
      translate("Staff changÃ©", "ØªÙ… ØªØ¨Ø¯ÙŠÙ„ Ø§Ù„Ù…ÙˆØ¸Ù"),
      translate(`ConnectÃ© en tant que ${account.name || role}.`, `ØªÙ… Ø§Ù„Ø¯Ø®ÙˆÙ„ ÙƒÙ€ ${account.name || role}.`)
    )
    toast({
      title: translate("Staff actif mis Ã  jour", "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„Ù†Ø´Ø·"),
      description: translate(`RÃ´le actif: ${role}`, `Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ù†Ø´Ø·: ${role}`),
    })
    return { ok: true }
  }, [hashLocalPassword, pushNotification, setStaffRole, staffAccounts, toast, translate])

  const loadStaffAccounts = useCallback(async () => {
    if (typeof window === "undefined") return
    const electronAPI = (window as any)?.electronAPI
    if (!electronAPI?.store?.get) return
    const stored = await Promise.resolve(electronAPI.store.get("device_staff_accounts")).catch(() => [])
    if (Array.isArray(stored)) {
      setStaffAccounts(stored)
    }
  }, [])

  useEffect(() => {
    if (!isElectronRuntime) return
    loadStaffAccounts()
  }, [isElectronRuntime, loadStaffAccounts])

  useEffect(() => {
    if (typeof window === "undefined") return
    const installKey = "vendor-subscription-installed-at"
    const storedInstallAt = Number(localStorage.getItem(installKey) || "0")
    if (!storedInstallAt) {
      localStorage.setItem(installKey, String(Date.now()))
    }
  }, [])

  const subscriptionReminderDays = useMemo(() => {
    const defaults = [14, 7, 3, 1, 0]
    if (typeof window === "undefined") return defaults
    const fromStorage = localStorage.getItem("vendor-subscription-reminder-days")
    if (fromStorage) {
      try {
        const parsed = JSON.parse(fromStorage)
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((n) => Number(n))
            .filter((n) => Number.isFinite(n) && n >= 0)
            .map((n) => Math.floor(n))
          if (normalized.length > 0) {
            return Array.from(new Set(normalized)).sort((a, b) => b - a)
          }
        }
      } catch {
        // Ignore malformed local value
      }
    }
    const fromEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_REMINDER_DAYS
    if (fromEnv) {
      const normalized = fromEnv
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n >= 0)
        .map((n) => Math.floor(n))
      if (normalized.length > 0) return Array.from(new Set(normalized)).sort((a, b) => b - a)
    }
    return defaults
  }, [])

  const buildSubscriptionReminder = useCallback((daysLeft: number) => {
    if (daysLeft <= 0) {
      return {
        title: translate("Abonnement expirÃ©", "Ø§Ù†ØªÙ‡Ù‰ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ"),
        description: translate(
          "Votre abonnement est expirÃ©. Renouvelez maintenant pour Ã©viter toute interruption des ventes.",
          "Ø§Ù†ØªÙ‡Ù‰ Ø§Ø´ØªØ±Ø§ÙƒÙƒ. Ø¬Ø¯Ø¯ Ø§Ù„Ø¢Ù† Ù„ØªØ¬Ù†Ø¨ Ø£ÙŠ Ø§Ù†Ù‚Ø·Ø§Ø¹ ÙÙŠ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª."
        ),
      }
    }
    if (daysLeft === 1) {
      return {
        title: translate("Abonnement expire demain", "Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙŠÙ†ØªÙ‡ÙŠ ØºØ¯Ù‹Ø§"),
        description: translate(
          "Il reste 1 jour. PrÃ©parez le renouvellement pour garder l'application active.",
          "ÙŠØªØ¨Ù‚Ù‰ ÙŠÙˆÙ… ÙˆØ§Ø­Ø¯. Ø¬Ù‡Ø² Ø§Ù„ØªØ¬Ø¯ÙŠØ¯ Ù„Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø¹Ù…Ù„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚."
        ),
      }
    }
    return {
      title: translate("Rappel d'abonnement", "ØªØ°ÙƒÙŠØ± Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ"),
      description: translate(
        `Il reste ${daysLeft} jour(s) avant expiration de l'abonnement.`,
        `ÙŠØªØ¨Ù‚Ù‰ ${daysLeft} ÙŠÙˆÙ… Ù‚Ø¨Ù„ Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ.`
      ),
    }
  }, [translate])

  useEffect(() => {
    if (typeof window === "undefined") return
    const installAt = Number(localStorage.getItem("vendor-subscription-installed-at") || "0")
    const fallbackEnd = installAt ? installAt + 30 * 24 * 60 * 60 * 1000 : 0
    const periodEndMs = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).getTime()
      : fallbackEnd
    if (!Number.isFinite(periodEndMs)) return
    const daysLeft = Math.ceil((periodEndMs - Date.now()) / (24 * 60 * 60 * 1000))
    const remindDays = new Set(subscriptionReminderDays)
    if (!remindDays.has(Math.max(0, daysLeft))) return
    const remindKey = `vendor-subscription-reminder:${Math.max(0, daysLeft)}`
    const today = new Date().toISOString().slice(0, 10)
    const alreadySent = localStorage.getItem(remindKey)
    if (alreadySent === today) return
    localStorage.setItem(remindKey, today)
    const message = buildSubscriptionReminder(Math.max(0, daysLeft))
    pushNotification(message.title, message.description)
  }, [buildSubscriptionReminder, pushNotification, subscription?.currentPeriodEnd, subscriptionReminderDays])

  useEffect(() => {
    const updater = (window as any)?.electronAPI?.updater
    if (!updater?.onUpdateAvailable || !updater?.onDownloaded) return
    const offAvailable = updater.onUpdateAvailable((payload: any) => {
      pushNotification(
        translate("Mise Ã  jour disponible", "ØªØ­Ø¯ÙŠØ« Ù…ØªØ§Ø­"),
        translate(
          `Version ${payload?.version || "nouvelle"} prÃªte Ã  tÃ©lÃ©charger.`,
          `Ø§Ù„Ø¥ØµØ¯Ø§Ø± ${payload?.version || "Ø§Ù„Ø¬Ø¯ÙŠØ¯"} Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙ†Ø²ÙŠÙ„.`
        )
      )
    })
    const offDownloaded = updater.onDownloaded((payload: any) => {
      pushNotification(
        translate("Mise Ã  jour prÃªte", "Ø§Ù„ØªØ­Ø¯ÙŠØ« Ø¬Ø§Ù‡Ø²"),
        translate(
          `Version ${payload?.version || "nouvelle"} tÃ©lÃ©chargÃ©e. Cliquez sur redÃ©marrer pour installer.`,
          `ØªÙ… ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ø¥ØµØ¯Ø§Ø± ${payload?.version || "Ø§Ù„Ø¬Ø¯ÙŠØ¯"}. Ø§Ø¶ØºØ· Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ Ù„Ù„ØªØ«Ø¨ÙŠØª.`
        )
      )
    })
    return () => {
      offAvailable?.()
      offDownloaded?.()
    }
  }, [pushNotification, translate])

  useEffect(() => {
    if (lowStockProducts.length === 0 || typeof window === "undefined") return
    const today = new Date().toISOString().slice(0, 10)
    const key = "vendor-low-stock-reminder-date"
    if (localStorage.getItem(key) === today) return
    localStorage.setItem(key, today)
    pushNotification(
      translate("Stock faible", "Ù…Ø®Ø²ÙˆÙ† Ù…Ù†Ø®ÙØ¶"),
      translate(
        `${lowStockProducts.length} produit(s) sont en stock faible.`,
        `${lowStockProducts.length} Ù…Ù†ØªØ¬Ù‹Ø§ ÙÙŠ Ù…Ø®Ø²ÙˆÙ† Ù…Ù†Ø®ÙØ¶.`
      )
    )
  }, [lowStockProducts, pushNotification, translate])

  const handleAddStaffAccount = useCallback(async () => {
    if (!isElectronRuntime) return
    if (!staffForm.name || !staffForm.password || !staffForm.confirmPassword) {
      toast({
        title: translate("Champs requis", "Ø­Ù‚ÙˆÙ„ Ù…Ø·Ù„ÙˆØ¨Ø©"),
        description: translate("Remplissez le nom et le mot de passe.", "Ø§Ù…Ù„Ø£ Ø§Ù„Ø§Ø³Ù… ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±."),
        variant: "destructive",
      })
      return
    }
    if (staffForm.password !== staffForm.confirmPassword) {
      toast({
        title: translate("Mot de passe invalide", "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚Ø©"),
        description: translate("Les mots de passe ne correspondent pas.", "ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†."),
        variant: "destructive",
      })
      return
    }
    const normalizeCode = (code: string) => code.replace(/\D/g, '').slice(0, 4)
    const existingCodes = new Set(
      staffAccounts.map((acc) => String(acc.staffCode || '').trim())
    )
    let staffCode = normalizeCode(staffForm.staffCode || '')
    if (staffCode && existingCodes.has(staffCode)) {
      toast({
        title: translate("Code existant", "Ø§Ù„Ø±Ù…Ø² Ù…Ø³ØªØ®Ø¯Ù…"),
        description: translate("Choisissez un code unique.", "Ø§Ø®ØªØ± Ø±Ù…Ø²Ø§Ù‹ ÙØ±ÙŠØ¯Ø§Ù‹."),
        variant: "destructive",
      })
      return
    }
    if (!staffCode) {
      let attempts = 0
      while (attempts < 20) {
        const candidate = String(Math.floor(1000 + Math.random() * 9000))
        if (!existingCodes.has(candidate)) {
          staffCode = candidate
          break
        }
        attempts += 1
      }
    }
    if (!staffCode) {
      toast({
        title: translate("Erreur", "Ø®Ø·Ø£"),
        description: translate("Impossible de gÃ©nÃ©rer un code unique.", "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø±Ù…Ø² ÙØ±ÙŠØ¯."),
        variant: "destructive",
      })
      return
    }
    const electronAPI = (window as any)?.electronAPI
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
    const passwordHash = await hashLocalPassword(staffForm.password, saltHex)
    const pinSalt = crypto.getRandomValues(new Uint8Array(16))
    const pinSaltHex = Array.from(pinSalt).map((b) => b.toString(16).padStart(2, "0")).join("")
    const pinHash = staffForm.pin
      ? await hashLocalPassword(staffForm.pin, pinSaltHex)
      : null
    const next = [
      ...staffAccounts,
      {
        id: `staff-${Date.now()}`,
        name: staffForm.name,
        phone: staffForm.phone,
        email: staffForm.email,
        role: staffForm.role,
        staffCode,
        passwordHash,
        salt: saltHex,
        pinHash,
        pinSalt: pinHash ? pinSaltHex : null,
        createdAt: new Date().toISOString(),
      },
    ]
    await Promise.resolve(electronAPI.store.set("device_staff_accounts", next)).catch(() => null)
    setStaffAccounts(next)
    setStaffForm({ name: "", phone: "", email: "", role: "cashier", password: "", confirmPassword: "", pin: "", staffCode: "" })
    toast({
      title: translate("Compte crÃ©Ã©", "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨"),
      description: translate("Le compte du personnel est prÃªt.", "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…ÙˆØ¸Ù."),
    })
  }, [hashLocalPassword, isElectronRuntime, staffAccounts, staffForm, toast, translate])

  const handleResetStaffPin = useCallback(async (id: string) => {
    if (!isElectronRuntime) return
    const electronAPI = (window as any)?.electronAPI
    const next = staffAccounts.map((acc) =>
      acc.id === id ? { ...acc, pinHash: null, pinSalt: null } : acc
    )
    await Promise.resolve(electronAPI.store.set("device_staff_accounts", next)).catch(() => null)
    setStaffAccounts(next)
    toast({
      title: translate("PIN rÃ©initialisÃ©", "ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† PIN"),
      description: translate("Le personnel devra dÃ©finir un nouveau PIN.", "ÙŠØ¬Ø¨ Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ¸Ù ØªØ¹ÙŠÙŠÙ† PIN Ø¬Ø¯ÙŠØ¯."),
    })
    setStaffPinResetOpen(false)
    setStaffPinResetTarget(null)
  }, [isElectronRuntime, staffAccounts, toast, translate])

  const handleRemoveStaffAccount = useCallback(async (id: string) => {
    if (!isElectronRuntime) return
    const electronAPI = (window as any)?.electronAPI
    const next = staffAccounts.filter((acc) => acc.id !== id)
    await Promise.resolve(electronAPI.store.set("device_staff_accounts", next)).catch(() => null)
    setStaffAccounts(next)
  }, [isElectronRuntime, staffAccounts])

  const loadShopInfo = useCallback(async () => {
    try {
      const targetVendorId = isAdmin ? activeVendorId : effectiveUser?.id
      if (!targetVendorId) return
      if (isLocalOfflineVendor) return
      const res = await fetch(`/api/stores?vendorId=${targetVendorId}&includeInactive=true&limit=1`, { method: "GET" })
      if (!res.ok) return
      const data = await res.json()
      const stores = data?.data?.stores || data?.stores || []
      const store = stores[0]
      if (store) {
        const profile = {
          name: store.name || shopInfo.name,
          address: store.address || shopInfo.address,
          phone: store?.vendor?.phone || shopInfo.phone,
        }
        setShopInfo((prev: any) => ({ ...prev, ...profile }))
        if (typeof window !== "undefined") {
          localStorage.setItem("vendor-shop-info", JSON.stringify({ ...shopInfo, ...profile }))
        }
      }
    } catch (error) {
      console.warn("[Vendor] Failed to load shop profile", error)
    }
  }, [shopInfo, isAdmin, activeVendorId, effectiveUser?.id, isLocalOfflineVendor])

  useEffect(() => {
    try {
      localStorage.setItem("vendor-shop-info", JSON.stringify(shopInfo))
    } catch {
      // ignore
    }
  }, [shopInfo])

  useEffect(() => {
    if (status === "authenticated") {
      loadShopInfo()
    }
  }, [status, loadShopInfo])

  const isWithinSchedule = useCallback(() => {
    if (!menuSchedule.length) return true
    const now = new Date()
    const minutesNow = now.getHours() * 60 + now.getMinutes()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    const applicable = menuSchedule.filter((slot) => {
      if (slot.enabled === false) return false
      if (slot.kind === "all") return true
      if (slot.kind === "weekend") return isWeekend
      return !isWeekend
    })
    if (!applicable.length) return true
    return applicable.some((slot) => {
      const [sh, sm] = (slot.start || "00:00").split(":").map((n: string) => Number(n))
      const [eh, em] = (slot.end || "23:59").split(":").map((n: string) => Number(n))
      const startMin = sh * 60 + (Number.isFinite(sm) ? sm : 0)
      const endMin = eh * 60 + (Number.isFinite(em) ? em : 0)
      if (Number.isNaN(startMin) || Number.isNaN(endMin)) return true
      if (endMin < startMin) {
        // Overnight window (e.g., 22:00 -> 06:00)
        return minutesNow >= startMin || minutesNow <= endMin
      }
      return minutesNow >= startMin && minutesNow <= endMin
    })
  }, [menuSchedule])

  useEffect(() => {
    if (!autoPauseOutsideSchedule) return
    const allowed = isWithinSchedule()
    if (!allowed && isAcceptingOrders) {
      setIsAcceptingOrders(false)
      toast({
        title: translate("En pause hors horaires", "Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª Ø®Ø§Ø±Ø¬ Ø£ÙˆÙ‚Ø§Øª Ø§Ù„Ø¹Ù…Ù„"),
        description: translate("RÃ©activez vos horaires ou dÃ©sactivez l'auto-pause.", "Ø£Ø¹Ø¯ Ø¶Ø¨Ø· Ø§Ù„Ø³Ø§Ø¹Ø§Øª Ø£Ùˆ Ø¹Ø·Ù‘Ù„ Ø§Ù„Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ."),
        variant: "destructive",
      })
    }
  }, [autoPauseOutsideSchedule, isWithinSchedule, isAcceptingOrders, setIsAcceptingOrders, toast, translate])

  // Persist prep time
  useEffect(() => {
    try {
      localStorage.setItem('vendor-prep-minutes', prepTimeMinutes.toString())
    } catch (error) {
      console.warn('[Vendor] Failed to persist prep time', error)
    }
  }, [prepTimeMinutes])

  useEffect(() => {
    try {
      localStorage.setItem(
        "vendor-auto-print-whatsapp-confirm",
        autoPrintWhatsappOnConfirm ? "true" : "false",
      )
    } catch (e) {
      console.warn("[Vendor] Failed to persist WhatsApp auto-print preference", e)
    }
  }, [autoPrintWhatsappOnConfirm])

  const handleToggleAcceptingOrders = useCallback(async () => {
    if (!storeId) {
      toast({
        title: translate("Boutique introuvable", "Ø§Ù„Ù…ØªØ¬Ø± ØºÙŠØ± Ù…ØªØ§Ø­"),
        description: translate("Impossible de changer l'Ã©tat des commandes", "Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØºÙŠÙŠØ± Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª"),
        variant: "destructive",
      })
      return
    }

    const next = !isAcceptingOrders
    setIsUpdatingStoreStatus(true)
    setIsAcceptingOrders(next)
    try {
      console.info('[Vendor] toggle-order-intake', { storeId, next })
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        throw new Error(data?.error || 'Failed to update store status')
      }
      toast({
        title: next ? translate("Commandes rÃ©activÃ©es", "ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª") : translate("Commandes mises en pause", "ØªÙ… Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ø·Ù„Ø¨Ø§Øª"),
        description: next ? translate("Les clients peuvent commander", "ÙŠÙ…ÙƒÙ† Ù„Ù„Ø²Ø¨Ø§Ø¦Ù† Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø¢Ù†") : translate("Les nouvelles commandes sont bloquÃ©es", "ØªÙ… Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©"),
      })
    } catch (error) {
      console.error('[Vendor] Failed to toggle orders:', error)
      setIsAcceptingOrders(!next)
      toast({
        title: translate("Ã‰chec de la mise Ã  jour", "ÙØ´Ù„ Ø§Ù„ØªØ­Ø¯ÙŠØ«"),
        description: translate("RÃ©essayez ou contactez le support", "Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø£Ùˆ Ø§ØªØµÙ„ Ø¨Ø§Ù„Ø¯Ø¹Ù…"),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStoreStatus(false)
    }
  }, [storeId, isAcceptingOrders, toast, translate, setIsAcceptingOrders])

  const handleSubmitDispute = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    const amountValue = parseFloat(disputeForm.amount || '0')
    if (!disputeForm.payoutId) {
      toast({
        title: translate("SÃ©lectionnez un paiement", "Ø§Ø®ØªØ± Ø¯ÙØ¹Ø©"),
        description: translate("Choisissez un payout avant d'envoyer", "Ø§Ø®ØªØ± Ø¯ÙØ¹Ø© Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„"),
        variant: "destructive",
      })
      return
    }

    if (Number.isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: translate("Montant invalide", "Ù…Ø¨Ù„Øº ØºÙŠØ± ØµØ§Ù„Ø­"),
        description: translate("Entrez un montant positif", "Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºØ§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹"),
        variant: "destructive",
      })
      return
    }

    if (!disputeForm.reason || disputeForm.reason.trim().length < 5) {
      toast({
        title: translate("Informations manquantes", "Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù†Ø§Ù‚ØµØ©"),
        description: translate("Ajoutez une raison (5 caractÃ¨res min)", "Ø£Ø¶Ù Ø³Ø¨Ø¨Ø§Ù‹ Ù„Ø§ ÙŠÙ‚Ù„ Ø¹Ù† 5 Ø£Ø­Ø±Ù"),
        variant: "destructive",
      })
      return
    }

    setIsSubmittingDispute(true)
    try {
      const vendorId = isAdmin ? activeVendorId : effectiveUser?.id
      const q = isAdmin && vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""
      const res = await fetch(`/api/vendor/finance/disputes${q}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: disputeForm.payoutId,
          orderId: disputeForm.orderId.trim() || undefined,
          reason: disputeForm.reason.trim(),
          amount: amountValue,
          ...(isAdmin && vendorId ? { vendorId } : {}),
        }),
      })
      const json = await res.json()
      if (!json?.success) {
        const msg =
          json?.error?.message ||
          json?.message ||
          translate("Ã‰chec de l'envoi", "ÙØ´Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„")
        throw new Error(typeof msg === "string" ? msg : "Request failed")
      }
      const d = json.data?.dispute
      if (d?.id) {
        setDisputes((prev) => [
          {
            id: d.id,
            payoutId: d.payoutId,
            orderId: d.orderId ?? "",
            reason: d.reason,
            amount: d.amount,
            status: d.status,
          },
          ...prev,
        ])
      }
      setDisputeForm({ payoutId: '', orderId: '', reason: '', amount: '' })
      toast({
        title: translate("RÃ©clamation enregistrÃ©e", "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø¹ØªØ±Ø§Ø¶"),
        description: translate("Nous traiterons votre demande", "Ø³Ù†Ø¹Ø§Ù„Ø¬ Ø·Ù„Ø¨Ùƒ"),
      })
    } catch (error) {
      toast({
        title: translate("Ã‰chec de l'envoi", "ÙØ´Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„"),
        description: translate("RÃ©essayez ou contactez le support", "Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø£Ùˆ Ø§ØªØµÙ„ Ø¨Ø§Ù„Ø¯Ø¹Ù…"),
        variant: "destructive",
      })
    } finally {
      setIsSubmittingDispute(false)
    }
  }, [disputeForm, toast, translate])
  
  // Dashboard Data and Loading States
  const {
    loadingState,
    setLoadingState,
    fetchWithCache,
    fetchSales,
    fetchCustomers,
    fetchSuppliers,
    fetchProducts,
    fetchOrders,
    fetchCategories
  } = useDashboardData()

  useEffect(() => {
    if (isElectronRuntime || isLocalOfflineVendor) return
    if (!isAuthenticated) return
    const vendorId = isAdmin ? activeVendorId : effectiveUser?.id
    if (!vendorId) {
      setPayouts([])
      setDisputes([])
      return
    }
    let cancelled = false
    const q = isAdmin ? `?vendorId=${encodeURIComponent(vendorId)}` : ""
    ;(async () => {
      try {
        const [pr, dr] = await Promise.all([
          fetch(`/api/vendor/finance/payouts${q}`),
          fetch(`/api/vendor/finance/disputes${q}`),
        ])
        const pj = await pr.json()
        const dj = await dr.json()
        if (cancelled) return
        if (pj?.success && pj?.data?.payouts && Array.isArray(pj.data.payouts)) {
          setPayouts(pj.data.payouts as FinancePayoutRow[])
        } else if (!cancelled) {
          setPayouts([])
        }
        if (dj?.success && dj?.data?.disputes && Array.isArray(dj.data.disputes)) {
          setDisputes(dj.data.disputes as FinanceDisputeRow[])
        } else if (!cancelled) {
          setDisputes([])
        }
      } catch {
        if (!cancelled) {
          setPayouts([])
          setDisputes([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    isElectronRuntime,
    isLocalOfflineVendor,
    isAuthenticated,
    isAdmin,
    activeVendorId,
    effectiveUser?.id,
  ])

  // Refresh offline queue count (Electron offline DB preferred)
  const refreshOfflineQueueCount = useCallback(async () => {
    if (typeof window === 'undefined') return
    const electronAPI = (window as any)?.electronAPI
    if (electronAPI?.offline?.getStats) {
      try {
        const stats = await electronAPI.offline.getStats()
        if (stats?.pendingSales != null) {
          setOfflineQueueCount(stats.pendingSales)
          return
        }
      } catch (error) {
        console.warn('[Vendor] Failed to load offline stats', error)
      }
    }
    // Fallback to localStorage queue used in web mode
    try {
      const queued = JSON.parse(localStorage.getItem('offline-sales-queue') || '[]')
      setOfflineQueueCount(Array.isArray(queued) ? queued.length : 0)
    } catch (e) {
      setOfflineQueueCount(0)
    }
  }, [])

  useEffect(() => {
    refreshOfflineQueueCount()
  }, [refreshOfflineQueueCount])

  // Automatically push any queued offline sales when we're back online
  const syncOfflineSales = useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      if (isLocalOfflineVendor) return
      // Electron runtime: delegate to offline sync service when available
      if (isElectronRuntime && (window as any)?.electronAPI?.offline?.syncNow) {
        const stats = await (window as any).electronAPI.offline.syncNow()
        const pending = typeof stats?.pendingSales === "number" ? stats.pendingSales : offlineQueueCount
        setOfflineQueueCount(pending)

        if (stats?.syncedSales > 0) {
          fetchDashboardData(activeVendorId)
          fetchInventory(activeVendorId)
          fetchSales(activeVendorId, { skipCache: true })
          toast({
            title: translate("Ventes synchronisÃ©es", "ØªÙ…Øª Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª"),
            description: translate(
              `${stats.syncedSales} vente(s) ont Ã©tÃ© envoyÃ©es`,
              `ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ${stats.syncedSales} Ø¹Ù…Ù„ÙŠØ© Ø¨ÙŠØ¹`
            ),
          })
        }
        return
      }

      // Web runtime: sync queued payloads stored in localStorage
      const queued = JSON.parse(localStorage.getItem("offline-sales-queue") || "[]")
      if (!Array.isArray(queued) || queued.length === 0) {
        setOfflineQueueCount(0)
        return
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOfflineQueueCount(queued.length)
        return
      }

      const remaining: any[] = []
      let syncedCount = 0

      for (const entry of queued) {
        try {
          const res = await fetch(`/api/erp/sales${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`, {
            method: "POST",
            body: JSON.stringify(entry.payload),
          })
          const data = await res.json()

          if (res.ok && data?.success) {
            syncedCount += 1
            removeLocalProvisionalSale(entry.id)
          } else {
            remaining.push(entry)
          }
        } catch (err) {
          remaining.push(entry)
        }
      }

      localStorage.setItem("offline-sales-queue", JSON.stringify(remaining))
      setOfflineQueueCount(remaining.length)

      if (syncedCount > 0) {
        fetchDashboardData(activeVendorId)
        fetchInventory(activeVendorId)
        fetchSales(activeVendorId, { skipCache: true })
        toast({
          title: translate("Ventes synchronisÃ©es", "ØªÙ…Øª Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª"),
          description: translate(
            `${syncedCount} vente(s) ont Ã©tÃ© envoyÃ©es`,
            `ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ${syncedCount} Ø¹Ù…Ù„ÙŠØ© Ø¨ÙŠØ¹`
          ),
        })
      }
    } catch (error) {
      console.warn("[POS] Failed to sync offline queue automatically", error)
    }
  }, [activeVendorId, fetchDashboardData, fetchInventory, fetchSales, isElectronRuntime, isLocalOfflineVendor, offlineQueueCount, toast, translate])

  useEffect(() => {
    syncOfflineSales()
    const handleOnline = () => syncOfflineSales()
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
      }
    }
  }, [syncOfflineSales])

  useEffect(() => {
    const onRefresh = () => {
      if (isLocalOfflineVendor) return
      fetchDashboardData(activeVendorId)
      fetchInventory(activeVendorId)
      fetchSales(activeVendorId, { skipCache: true })
    }
    window.addEventListener("vendor-refresh-data", onRefresh)
    return () => window.removeEventListener("vendor-refresh-data", onRefresh)
  }, [activeVendorId, fetchDashboardData, fetchInventory, fetchSales, isLocalOfflineVendor])

  // Offline / Electron: Historique reads from merged localStorage; refresh when opening the tab.
  useEffect(() => {
    if (activeTab !== "sales") return
    const useLocalHistory =
      isElectronRuntime ||
      isLocalOfflineVendor ||
      (typeof navigator !== "undefined" && !navigator.onLine)
    if (!useLocalHistory) return
    setSales(getMergedLocalSalesHistory())
  }, [activeTab, isElectronRuntime, isLocalOfflineVendor, setSales])

  // Electron quick-search shortcut (F3 / Ctrl+F): open POS and focus search.
  useEffect(() => {
    if (!isElectronRuntime || typeof window === "undefined") return
    const shortcuts = (window as any)?.electronAPI?.shortcuts
    if (!shortcuts?.onSearch) return

    shortcuts.onSearch(() => {
      setActiveTab("pos")
      setTimeout(() => {
        const input = document.getElementById("pos-search-input") as HTMLInputElement | null
        input?.focus()
        input?.select()
      }, 80)
    })
  }, [isElectronRuntime, setActiveTab])

  // Keyboard shortcuts for all vendor pages (Ctrl/Cmd+Shift+<key>).
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      if (isTypingTarget) return

      const isQuestionMark =
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        (event.key === "?" || (event.key === "/" && event.shiftKey))
      if (isQuestionMark) {
        event.preventDefault()
        setShowShortcutsDialog(true)
        return
      }

      const tabId = getTabIdForShortcut(event)
      if (!tabId) return
      if (tabId !== "menu" && !allowedTabIds.includes(tabId)) return

      event.preventDefault()
      setActiveTab(tabId)
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [allowedTabIds, setActiveTab])

  // Load vendor store info to control intake/pause (skip in Electron offline mode â€” no web session)
  useEffect(() => {
    const targetVendorId = isAdmin ? activeVendorId : effectiveUser?.id
    if (!targetVendorId) return
    const vid = String(targetVendorId)
    if (isElectronRuntime && (vid.startsWith('local-') || vid.startsWith('electron-'))) return

    const controller = new AbortController()
    const loadStore = async () => {
      try {
        const res = await fetch(`/api/stores?vendorId=${targetVendorId}&includeInactive=true&limit=1`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        const stores = data?.data?.stores || data?.stores || []
        if (stores.length > 0) {
          setStoreId(stores[0].id)
          setIsAcceptingOrders(stores[0].isActive !== false)
        }
      } catch (error) {
        // ignore (e.g. 401 in Electron, network errors)
      }
    }

    loadStore()
    return () => controller.abort()
  }, [effectiveUser?.id, activeVendorId, isAdmin, isElectronRuntime, setStoreId, setIsAcceptingOrders])

  // Initial offline queue count
  useEffect(() => {
    if (isElectronRuntime) {
      refreshOfflineQueueCount()
    }
  }, [isElectronRuntime, refreshOfflineQueueCount])
  
  // POS States - using custom hook
  const {
    posCart,
    posCustomerId,
    posDiscount,
    posTax,
    posDiscountPercent,
    posTaxPercent,
    posSelectedCategory,
    posOrderNumber,
    posKeypadValue,
    posSearch,
    cartSubtotal,
    setPosCustomerId,
    setPosDiscount,
    setPosTax,
    setPosDiscountPercent,
    setPosTaxPercent,
    setPosSelectedCategory,
    setPosOrderNumber,
    setPosKeypadValue,
    setPosSearch,
    posCouponCode,
    posAppliedCoupon,
    setPosCouponCode,
    setPosAppliedCoupon,
    addToCart,
    addCustomItemToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    applyCoupon,
  } = usePOSCart()
  
  // Update discount when keypad value changes
  useEffect(() => {
    if (posKeypadValue && cartSubtotal > 0) {
      const discountValue = parseFloat(posKeypadValue) || 0
      setPosDiscount(discountValue)
      // Calculate percentage from discount amount
      if (discountValue > 0) {
        const calculatedPercent = (discountValue / cartSubtotal) * 100
        setPosDiscountPercent(calculatedPercent)
      } else {
        setPosDiscountPercent(0)
      }
    } else {
      setPosDiscount(0)
      if (!posKeypadValue) {
        setPosDiscountPercent(0)
      }
    }
  }, [posKeypadValue, cartSubtotal, setPosDiscount, setPosDiscountPercent])

  // Coupon handlers
  const handleApplyCoupon = useCallback(() => {
    if (!posCouponCode.trim()) return

    const coupons: any[] = JSON.parse(localStorage.getItem('vendor-coupons') || '[]')
    const coupon = coupons.find((c) => c.code.toUpperCase() === posCouponCode.toUpperCase())

    if (!coupon) {
      toast({
        title: translate("Coupon invalide", "ÙƒÙˆØ¨ÙˆÙ† ØºÙŠØ± ØµØ§Ù„Ø­"),
        description: translate("Le code coupon n'existe pas", "Ø±Ù…Ø² Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯"),
        variant: "destructive",
      })
      return
    }

    const result = applyCoupon(coupon, cartSubtotal)
    if (result.discount > 0) {
      setPosAppliedCoupon(coupon)
      setPosDiscount(result.discount)
      setPosDiscountPercent((result.discount / cartSubtotal) * 100)
      toast({
        title: translate("Coupon appliquÃ©", "ØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†"),
        description: translate(`RÃ©duction de ${result.discount.toFixed(2)} DZD appliquÃ©e`, `ØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø®ØµÙ… Ø¨Ù‚ÙŠÙ…Ø© ${result.discount.toFixed(2)} Ø¯Ø¬`),
      })
    } else {
      toast({
        title: translate("Coupon non applicable", "Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØºÙŠØ± Ù‚Ø§Ø¨Ù„ Ù„Ù„ØªØ·Ø¨ÙŠÙ‚"),
        description: translate("Le coupon ne peut pas Ãªtre appliquÃ© Ã  cette commande", "Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨"),
        variant: "destructive",
      })
    }
  }, [posCouponCode, cartSubtotal, applyCoupon, toast, translate, setPosAppliedCoupon, setPosDiscount, setPosDiscountPercent])

  const handleRemoveCoupon = useCallback(() => {
    setPosAppliedCoupon(null)
    setPosCouponCode("")
    setPosDiscount(0)
    setPosDiscountPercent(0)
  }, [setPosAppliedCoupon, setPosCouponCode, setPosDiscount, setPosDiscountPercent])

  // When scanner is opened from ProductDialog (add item), fill barcode field and close
  const productFormScanRef = useRef(false)
  const setBarcodeScannerOpenRef = useRef<(open: boolean) => void>(() => {})

  // Barcode Scanner - now using hook (must be after translate is defined)
  const {
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    isBarcodeDetectorSupported,
    barcodeScannerError,
    barcodeVideoRef,
  } = useBarcodeScanner({
    products,
    onProductFound: addToCart,
    onBarcodeScanned: (value: string) => {
      if (productFormScanRef.current) {
        setProductForm((prev: any) => ({ ...prev, barcode: value }))
        productFormScanRef.current = false
        setBarcodeScannerOpenRef.current(false)
      } else {
        setPosSearch(value)
      }
    },
    translate,
  })
  setBarcodeScannerOpenRef.current = setIsBarcodeScannerOpen

  // RFID keyboard wedge: reader sends "RFID:" + tag ID + Enter. Look up product by RFID or barcode and add to cart.
  useEffect(() => {
    if (!isElectronRuntime || typeof window === "undefined") return
    const api = (window as any).electronAPI
    if (!api?.rfid?.onRfidScanned) return

    const handleRfidScanned = async (tagId: string) => {
      if (!tagId?.trim()) return
      const offline = api.offline
      let product: any = null
      if (offline?.getProductByRfidTag) {
        product = await offline.getProductByRfidTag(tagId.trim())
      }
      if (!product && offline?.getProductByBarcode) {
        product = await offline.getProductByBarcode(tagId.trim())
      }
      if (!product) {
        const fromList = products.find(
          (p) => p.barcode === tagId.trim() || (p as any).rfidTagId === tagId.trim()
        )
        if (fromList) product = fromList
      }
      if (product) {
        addToCart({
          id: product.id,
          name: product.name,
          sellingPrice: product.sellingPrice ?? product.price ?? 0,
          stock: product.stock ?? 0,
          barcode: product.barcode,
          sku: product.sku,
          category: product.category,
          image: product.image,
        } as any)
        playSuccessSound()
        toast({
          title: translate("Produit ajoutÃ© (RFID)", "ØªÙ…Øª Ø§Ù„Ø¥Ø¶Ø§ÙØ© (RFID)"),
          description: product.name,
        })
      } else {
        setPosSearch(tagId.trim())
        toast({
          title: translate("RFID non liÃ©", "Ø§Ù„ÙˆØ³Ù… ØºÙŠØ± Ù…Ø±ØªØ¨Ø·"),
          description: translate(
            "Aucun produit pour ce tag. Vous pouvez rechercher par code.",
            "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ù†ØªØ¬ Ù„Ù‡Ø°Ø§ Ø§Ù„ÙˆØ³Ù…. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¨Ø­Ø« Ø¨Ø§Ù„Ø±Ù…Ø²."
          ),
          variant: "destructive",
        })
      }
    }

    api.rfid.onRfidScanned(handleRfidScanned)
  }, [isElectronRuntime, addToCart, setPosSearch, products, toast, translate])

  // Hardware barcode scanner (keyboard wedge): add to cart or set search
  useEffect(() => {
    if (!isElectronRuntime || typeof window === "undefined") return
    const api = (window as any).electronAPI
    if (!api?.scanner?.onBarcodeScanned) return

    const handleBarcodeScanned = async (barcode: string) => {
      if (!barcode?.trim()) return
      const offline = api.offline
      let product: any = null
      if (offline?.getProductByBarcode) {
        product = await offline.getProductByBarcode(barcode.trim())
      }
      if (!product) {
        product = products.find((p) => p.barcode === barcode.trim())
      }
      if (product) {
        addToCart({
          id: product.id,
          name: product.name,
          sellingPrice: product.sellingPrice ?? product.price ?? 0,
          stock: product.stock ?? 0,
          barcode: product.barcode,
          sku: product.sku,
          category: product.category,
          image: product.image,
        } as any)
        playSuccessSound()
        toast({
          title: translate("Produit ajoutÃ©", "ØªÙ…Øª Ø§Ù„Ø¥Ø¶Ø§ÙØ©"),
          description: product.name,
        })
      } else {
        if (productFormScanRef.current) {
          setProductForm((prev: any) => ({ ...prev, barcode: barcode.trim() }))
          productFormScanRef.current = false
          setBarcodeScannerOpenRef.current(false)
        } else {
          setPosSearch(barcode.trim())
        }
      }
    }

    api.scanner.onBarcodeScanned(handleBarcodeScanned)
  }, [isElectronRuntime, addToCart, setPosSearch, products, toast, translate])

// File upload handler - using utility function
const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  await handleFileUploadUtil({
    event,
    selectedProductForImage,
    products,
    isElectronRuntime,
    activeVendorId,
    setProducts,
    setLowStockProducts,
    setProductForm,
    setShowImageUploadDialog,
    setSelectedProductForImage,
    fetchInventory,
    fetchDashboardData,
    toast,
    translate,
    fileInputRef,
  })
}

// Barcode scanner cleanup is handled by useBarcodeScanner hook

  // Form reset functions - now using utility functions
  const handleResetProductForm = () => {
    setProductForm(resetProductForm())
  }

  const handleResetCustomerForm = () => {
    setCustomerForm(resetCustomerForm())
  }

  // Data loading function - using utility function
  const handleDataLoad = useCallback(
    async (vendorContextId?: string) => {
      if (isLocalOfflineVendor) return
      await handleDataLoadUtil({
        vendorContextId,
        fetchSales,
        fetchOrders,
        fetchProducts,
        fetchCustomers,
        fetchSuppliers,
        fetchCategories,
        setSales,
        setOrders,
        setProducts,
        setLowStockProducts,
        setCustomers,
        setSuppliers,
        setCategories,
        setTodaySales,
        setWeekSales,
        setMonthSales,
        setTopProducts,
        setLoadingState,
        toast,
        translate,
      })
    },
    [fetchSales, fetchOrders, fetchProducts, fetchCustomers, fetchSuppliers, fetchCategories, setSales, setOrders, setProducts, setLowStockProducts, setCustomers, setSuppliers, setCategories, setTodaySales, setWeekSales, setMonthSales, setTopProducts, setLoadingState, toast, translate, isLocalOfflineVendor]
  )

  // Fetch Drivers and AI Insights - handled by useDataLoading hook

  // Save Product - using utility function
  const handleSaveProduct = async () => {
    await saveProduct({
      productForm,
      editingProduct,
      activeVendorId,
      isElectronRuntime,
      setProducts,
      setLowStockProducts,
      setProductForm,
      setEditingProduct,
      setShowProductDialog,
      toast,
      translate,
    })
  }

  // Post Product to Delivery - using utility function
  const handlePostProductToDelivery = async (inventoryProductId: string | number) => {
    await postProductToDelivery({
      inventoryProductId,
      toast,
      translate,
      playSuccessSound,
    })
  }

  // Update Order Status - using utility function
  const handleAssignOrderDriver = async (order: Order, driverUserId: string | null) => {
    await assignOrderDriver({
      orderId: String(order.id),
      driverId: driverUserId,
      fetchOrders,
      activeVendorId,
      toast,
      translate,
      playSuccessSound,
    })
  }

  const handleUpdateOrderStatus = async (order: Order, status: string) => {
    await updateOrderStatus({
      orderId: order.id,
      status,
      orderSnapshot: order,
      autoPrintWhatsappOnAccept: autoPrintWhatsappOnConfirm,
      printContext: {
        shopInfo,
        effectiveUser,
        isElectronRuntime,
        translate,
      },
      fetchOrders,
      activeVendorId,
      toast,
      translate,
      playSuccessSound,
    })
  }

  // Fetch Drivers - using utility function
  const fetchDrivers = async () => {
    await fetchDriversUtil({
      activeVendorId,
      setConnectedDrivers,
      setPendingDriverRequests,
      setLoadingDrivers,
    })
  }

  // Respond to Driver Connection Request - using utility function
  const respondToDriverRequest = async (connectionId: string, action: "accept" | "reject") => {
    await respondToDriverRequestUtil({
      connectionId,
      action,
      fetchDrivers,
      toast,
      translate,
      playSuccessSound,
    })
  }

  const inviteVendorDriverHandler = async (params: { email?: string; phone?: string }) => {
    await inviteVendorDriverUtil({
      email: params.email,
      phone: params.phone,
      fetchDrivers,
      toast,
      translate,
      playSuccessSound,
    })
  }

  const handleDriverDispatchChange = async (driverId: string, availableForDispatch: boolean) => {
    await setDriverDispatchAvailabilityUtil({
      driverId,
      availableForDispatch,
      fetchDrivers,
      toast,
      translate,
      playSuccessSound,
    })
  }

  const connectedDriversForDispatch = useMemo(
    () =>
      connectedDrivers.filter(
        (c: { availableForDispatch?: boolean; driver?: { id?: string } }) =>
          c?.availableForDispatch !== false && Boolean(c?.driver?.id),
      ),
    [connectedDrivers],
  )

  // Delete Product - using utility function
  const handleDeleteProduct = async (id: number | string) => {
    if (!confirm(translate("ÃŠtes-vous sÃ»r de vouloir supprimer ce produit?", "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ØŸ"))) return
    await deleteProduct({
      id,
      activeVendorId,
      isElectronRuntime,
      setProducts,
      setLowStockProducts,
      fetchInventory,
      fetchDashboardData,
      toast,
      translate,
    })
  }

  // removeFromCart and updateCartQuantity are now provided by usePOSCart hook

  const trimRecentOrders = useCallback((timestamps: number[]) => {
    const cutoff = Date.now() - 60 * 60 * 1000
    return timestamps.filter((ts) => ts >= cutoff)
  }, [])

  const guardOrderWindow = useCallback(() => {
    if (autoPauseOutsideSchedule && !isWithinSchedule()) {
      if (isAcceptingOrders) {
        setIsAcceptingOrders(false)
      }
      toast({
        title: translate("En pause (hors horaires)", "Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª (Ø®Ø§Ø±Ø¬ Ø§Ù„ØªÙˆÙ‚ÙŠØª)"),
        description: translate("Modifiez vos horaires ou dÃ©sactivez l'auto-pause pour reprendre.", "Ø¹Ø¯Ù‘Ù„ Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ø¹Ù…Ù„ Ø£Ùˆ Ø¹Ø·Ù‘Ù„ Ø§Ù„Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø©."),
        variant: "destructive",
      })
      return false
    }

    const trimmed = trimRecentOrders(recentOrderTimestamps)
    if (trimmed.length !== recentOrderTimestamps.length) {
      setRecentOrderTimestamps(trimmed)
    }
    if (maxOrdersPerHour > 0 && trimmed.length >= maxOrdersPerHour) {
      toast({
        title: translate("CapacitÃ© atteinte", "ØªÙ… Ø¨Ù„ÙˆØº Ø§Ù„Ø³Ø¹Ø©"),
        description: translate("RÃ©duisez le volume ou augmentez le seuil horaire dans ParamÃ¨tres.", "Ø®ÙÙ‘Ø¶ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø£Ùˆ Ø²Ø¯ Ø§Ù„Ø­Ø¯ ÙÙŠ Ø§Ù„Ø³Ø§Ø¹Ø© Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª."),
        variant: "destructive",
      })
      return false
    }
    return true
  }, [autoPauseOutsideSchedule, isWithinSchedule, isAcceptingOrders, setIsAcceptingOrders, toast, translate, trimRecentOrders, recentOrderTimestamps, maxOrdersPerHour])

  const recordOrderTimestamp = useCallback(() => {
    const trimmed = trimRecentOrders([...recentOrderTimestamps, Date.now()])
    setRecentOrderTimestamps(trimmed)
  }, [recentOrderTimestamps, trimRecentOrders])

  // Complete Sale - using utility function
  const completeSale = async (paymentMethod: "cash" | "card") => {
    if (!guardOrderWindow()) return
    
    // Track coupon usage if a coupon was applied
    if (posAppliedCoupon && posAppliedCoupon.id) {
      const coupons: any[] = JSON.parse(localStorage.getItem('vendor-coupons') || '[]')
      const updatedCoupons = coupons.map((c) => {
        if (c.id === posAppliedCoupon.id) {
          return { ...c, usedCount: (c.usedCount || 0) + 1 }
        }
        return c
      })
      localStorage.setItem('vendor-coupons', JSON.stringify(updatedCoupons))
    }
    
    const success = await completeSaleUtil({
      paymentMethod,
      posCart,
      posDiscount,
      posTaxPercent,
      posCustomerId,
      isElectronRuntime,
      activeVendorId,
      isAdmin,
      setSales,
      setTodaySales,
      setWeekSales,
      setMonthSales,
      setProducts,
      setLowStockProducts,
      setLastSale,
      setCompletedSale,
      setShowSaleSuccessDialog,
      clearCart,
      setPosTax,
      setPosCustomerId: (id: number | null) => setPosCustomerId(id),
      setPosOrderNumber,
      fetchDashboardData,
      fetchInventory,
      fetchSales,
      toast,
      translate,
      isArabic,
      setOfflineQueueCount,
      isAcceptingOrders,
    })
    if (success) {
      recordOrderTimestamp()
    }
  }

  // Save Customer - using utility function
  const handleSaveCustomer = async () => {
    await saveCustomer({
      customerForm,
      activeVendorId,
      isElectronRuntime,
      setCustomers,
      setShowCustomerDialog,
      resetCustomerForm: handleResetCustomerForm,
      toast,
      translate,
    })
  }

  // Save Supplier - using utility function
  const handleSaveSupplier = async () => {
    await saveSupplier({
      supplierForm,
      activeVendorId,
      isElectronRuntime,
      setSuppliers,
      setShowSupplierDialog,
      setSupplierForm,
      toast,
      translate,
    })
  }

  // Data loading effects - using custom hook
  useDataLoading({
    status,
    isAuthenticated,
    user: effectiveUser,
    isAdmin,
    setIsAdmin,
    isElectronRuntime,
    selectedVendorId,
    setSelectedVendorId,
    setAvailableVendors,
    setIsLoadingVendors,
    activeVendorId,
    activeTab,
    handleDataLoad,
    setSalesForecast,
    setInventoryRecommendations,
    setProductBundles,
    setConnectedDrivers,
    setPendingDriverRequests,
    setLoadingDrivers,
    isDarkMode,
    setIsDarkMode,
    toast,
    translate,
  })

  // ALL HOOKS MUST BE CALLED BEFORE CONDITIONAL RETURNS
  // Calculate remaining cart values derived from subtotal (tax removed)
  const cartTax = 0 // Tax removed
  const calculatedTotal = cartSubtotal - posDiscount
  const cartTotal = manualTotal !== null ? manualTotal : calculatedTotal
  
  // Clear manual total when cart is cleared
  useEffect(() => {
    if (posCart.length === 0) {
      setManualTotal(null)
    }
  }, [posCart.length])

  // POS Handler Functions - using custom hook
  const {
    handleDiscountPercentChange,
    handleTaxPercentChange,
    handleKeypadKey,
    handleClearDiscount,
    handleClearCart,
  } = usePOSHandlers({
    cartSubtotal,
    setPosDiscountPercent,
    setPosDiscount,
    setPosKeypadValue,
    setPosTaxPercent,
    setPosTax,
    clearCart,
    setPosTaxPercentDefault: setPosTaxPercent,
  })

  // Manual total handler
  const handleManualTotalChange = useCallback((value: number | null) => {
    setManualTotal(value)
  }, [])

  const handleShopInfoChange = (field: string, value: string) => {
    setShopInfo((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleShopImageChange = (field: "logo" | "cover", file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setShopInfo((prev: any) => ({ ...prev, [field]: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveShopInfo = async () => {
    try {
      setShopInfo((prev: any) => ({ ...prev })) // trigger effect persist
      if ((window as any)?.electronAPI?.store?.set) {
        const storeAPI = (window as any).electronAPI.store
        await storeAPI.set("vendor-shop-info", shopInfo)
      }
      toast({
        title: translate("Informations enregistrÃ©es", "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª"),
        description: translate("Les donnÃ©es de boutique sont prÃªtes pour reÃ§us et affichage.", "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ØªØ¬Ø± Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ø¥ÙŠØµØ§Ù„Ø§Øª ÙˆØ§Ù„Ø¹Ø±Ø¶."),
      })
    } catch (error) {
      console.error("[Vendor] Failed to save shop info", error)
      toast({
        title: translate("Erreur de sauvegarde", "Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­ÙØ¸"),
        description: translate("RÃ©essayez ou vÃ©rifiez le stockage.", "Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø£Ùˆ ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ØªØ®Ø²ÙŠÙ†."),
        variant: "destructive",
      })
    }
  }

  const allowedMaxDiscount = useMemo(() => staffRole === "cashier" ? 20 : 90, [staffRole])
  const handleDiscountPercentChangeGuarded = useCallback((value: number) => {
    const capped = Math.min(value, allowedMaxDiscount)
    if (value > allowedMaxDiscount) {
      toast({
        title: translate("Limite de remise atteinte", "ØªÙ… Ø¨Ù„ÙˆØº Ø­Ø¯ Ø§Ù„Ø®ØµÙ…"),
        description: translate("Votre rÃ´le limite la remise maximale.", "Ø¯ÙˆØ±Ùƒ ÙŠØ­Ø¯Ø¯ Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø®ØµÙ…."),
        variant: "destructive",
      })
    }
    handleDiscountPercentChange(capped)
  }, [handleDiscountPercentChange, allowedMaxDiscount, toast, translate])

  // In Electron, gate on Electron auth check only (no NextAuth session in main window)
  const showLoading = isElectronRuntime
    ? !electronAuthChecked
    : (isLoading || status === "loading")

  if (showLoading) {
    return <LoadingScreen />
  }

  // When Electron auth checked but no user, show minimal message (e.g. session expired)
  if (isElectronRuntime && !effectiveUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Session expired or not authenticated.</p>
          <Button variant="outline" onClick={() => window.electronAPI?.auth?.logout?.()}>
            Return to login
          </Button>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated (web only)
  if (!isElectronRuntime && (!isAuthenticated || !user)) {
    return null
  }

  return (
    <>
      <VendorShell
        isArabic={isArabic}
        isElectronRuntime={isElectronRuntime}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedTabIds={allowedTabIds}
        translate={translate}
        unreadNotificationCount={unreadNotificationCount}
        onOpenProfile={() => setShowStaffSwitchDialog(true)}
        onOpenNotifications={() => setShowNotificationsPanel(true)}
        onOpenHelp={() => setShowShortcutsDialog(true)}
        onMinimize={handleMinimizeApp}
        onLogout={handleLogoutAction}
        isAdmin={isAdmin}
        selectedVendorId={selectedVendorId}
        setSelectedVendorId={setSelectedVendorId}
        availableVendors={availableVendors}
        isLoadingVendors={isLoadingVendors}
        subscription={subscription}
        subscriptionLoading={subscriptionLoading}
        onSubscriptionUpdated={async () => {
          await refetchSubscription()
        }}
      >
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <DashboardTab
              todaySales={todaySales}
              weekSales={weekSales}
              monthSales={monthSales}
              topProducts={topProducts}
              lowStockProducts={lowStockProducts}
              translate={translate}
              setActiveTab={setActiveTab}
              setShowProductDialog={setShowProductDialog}
            />
          </TabsContent>


          {/* POS Tab - Modern ALBAZ Design */}
          <TabsContent value="pos" className="space-y-0 p-0 -mx-2 sm:-mx-4 lg:-mx-5 2xl:-mx-6">
      <POSView
              products={products}
              categories={categories}
              posCart={posCart}
              posSearch={posSearch}
              posSelectedCategory={posSelectedCategory}
              posOrderNumber={posOrderNumber}
              posDiscount={posDiscount}
              posDiscountPercent={posDiscountPercent}
              posTaxPercent={posTaxPercent}
              posKeypadValue={posKeypadValue}
              cartSubtotal={cartSubtotal}
              cartTax={cartTax}
              cartTotal={cartTotal}
              manualTotal={manualTotal}
              isBarcodeDetectorSupported={isBarcodeDetectorSupported}
              isArabic={isArabic}
              translate={translate}
              onSearchChange={setPosSearch}
              onCategoryChange={setPosSelectedCategory}
              onBarcodeScan={() => setIsBarcodeScannerOpen(true)}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onDiscountPercentChange={handleDiscountPercentChangeGuarded}
              onTaxPercentChange={handleTaxPercentChange}
              onKeypadKey={handleKeypadKey}
              onClearDiscount={handleClearDiscount}
              onClearCart={handleClearCart}
              onManualTotalChange={handleManualTotalChange}
              onAddCustomItem={addCustomItemToCart}
              onCompleteSale={completeSale}
              posCouponCode={posCouponCode}
              posAppliedCoupon={posAppliedCoupon}
              onCouponCodeChange={setPosCouponCode}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              isElectronFullscreen={isElectronFullscreen}
            />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <InventoryTab
              products={products}
              isElectronRuntime={isElectronRuntime}
              activeVendorId={activeVendorId}
              isArabic={isArabic}
              dineTablesUi={vendorFeatures.dineTablesUi}
              translate={translate}
              toast={toast}
              setProducts={setProducts}
              setLowStockProducts={setLowStockProducts}
              setShowProductDialog={setShowProductDialog}
              setEditingProduct={setEditingProduct}
              setProductForm={setProductForm}
              setSelectedProductForImage={(id) => setSelectedProductForImage(typeof id === "number" ? id : (Number(id) || null))}
              setShowImageUploadDialog={setShowImageUploadDialog}
              fetchProducts={fetchProducts}
              handlePostProductToDelivery={handlePostProductToDelivery}
              handleDeleteProduct={handleDeleteProduct}
              onPrintLabels={
                vendorFeatures.labelPrinting &&
                isElectronRuntime &&
                (window as any).electronAPI?.print?.printProductLabels
                  ? async (items: InventoryProduct[]) => {
                      if (items.length === 0) {
                        toast({ title: translate("Aucun produit", "Ù„Ø§ Ù…Ù†ØªØ¬Ø§Øª"), description: translate("SÃ©lectionnez des produits Ã  imprimer", "Ø§Ø®ØªØ± Ù…Ù†ØªØ¬Ø§Øª Ù„Ù„Ø·Ø¨Ø§Ø¹Ø©"), variant: "destructive" })
                        return
                      }
                      try {
                        const res = await (window as any).electronAPI.print.printProductLabels({
                          products: items,
                          fields: labelFields,
                          labelType,
                          widthMm: labelWidthMm,
                          heightMm: labelHeightMm,
                          shopName: shopInfo?.name || '',
                          deviceName: getVendorPrinterDevice(VENDOR_PRINTER_LABEL_KEY) || undefined,
                        })
                        if (res?.success) toast({ title: translate("Impression lancÃ©e", "ØªÙ… Ø¨Ø¯Ø¡ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©"), description: translate("Les Ã©tiquettes ont Ã©tÃ© envoyÃ©es Ã  l'imprimante.", "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…Ù„ØµÙ‚Ø§Øª Ø¥Ù„Ù‰ Ø§Ù„Ø·Ø§Ø¨Ø¹Ø©.") })
                        else toast({ title: translate("Erreur", "Ø®Ø·Ø£"), description: res?.error || translate("Ã‰chec de l'impression", "ÙØ´Ù„ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©"), variant: "destructive" })
                      } catch (e: any) {
                        toast({ title: translate("Erreur", "Ø®Ø·Ø£"), description: e?.message || translate("Ã‰chec de l'impression", "ÙØ´Ù„ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©"), variant: "destructive" })
                      }
                    }
                  : undefined
              }
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <OrdersTab
              orders={orders}
              loadingState={loadingState}
              translate={translate}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              connectedDrivers={connectedDriversForDispatch}
              driverFleetAllowed={hasFeature("driverFleetManagement")}
              handleAssignOrderDriver={handleAssignOrderDriver}
              prepTimeMinutes={prepTimeMinutes}
              filterCustomerId={ordersCustomerFilter}
              highlightOrderId={highlightOrderId}
              onClearCustomerFilter={clearOrdersCustomerFilter}
            />
          </TabsContent>

          <TabsContent value="kitchen" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <KitchenTab
              orders={orders}
              loadingState={loadingState}
              translate={translate}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
            />
          </TabsContent>

          <TabsContent value="dine-qr" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <DineQrTab translate={translate} />
          </TabsContent>

          <TabsContent value="accounting" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <AccountingTab translate={translate} />
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <DriversTab
              loadingDrivers={loadingDrivers}
              pendingDriverRequests={pendingDriverRequests}
              connectedDrivers={connectedDrivers}
              translate={translate}
              respondToDriverRequest={respondToDriverRequest}
              driverFleetAllowed={hasFeature("driverFleetManagement")}
              onInviteDriver={inviteVendorDriverHandler}
              onDriverDispatchChange={handleDriverDispatchChange}
            />
          </TabsContent>

          {/* RFID Tab */}
          <TabsContent value="rfid" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <RfidDashboardTab
              translate={translate}
              isElectronRuntime={isElectronRuntime}
              onLinkProduct={(tagId) => setActiveTab("inventory")}
            />
          </TabsContent>


          {/* Sales History Tab */}
          <TabsContent value="sales" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <SalesTab
              sales={sales}
              translate={translate}
              user={effectiveUser}
              shopInfo={shopInfo}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <ReportsTab
              sales={sales}
              products={products}
              translate={translate}
            />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <CouponsTab
              translate={translate}
              isArabic={isArabic}
            />
          </TabsContent>

          {/* Sync & Save Tab (merged Backup + Cloud Sync) */}
          <TabsContent value="sync-save" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <SyncSaveTab translate={translate} vendorId={activeVendorId} />
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <EmailTab translate={translate} />
          </TabsContent>

          {/* Staff & Permissions Tab (merged: staff add + permissions) */}
          <TabsContent value="staff-permissions" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <StaffPermissionsTab
              translate={translate}
              isElectronRuntime={isElectronRuntime}
              electronStaffAccounts={staffAccounts}
              electronStaffForm={staffForm}
              onElectronStaffFormChange={setStaffForm}
              onAddElectronStaff={handleAddStaffAccount}
              onRemoveElectronStaff={handleRemoveStaffAccount}
              onOpenElectronPinReset={(account: unknown) => {
                setStaffPinResetTarget(account)
                setStaffPinResetOpen(true)
              }}
              electronPinResetOpen={staffPinResetOpen}
              onElectronPinResetOpenChange={setStaffPinResetOpen}
              electronPinResetTarget={staffPinResetTarget}
              onConfirmElectronPinReset={(id: string | null) => id && handleResetStaffPin(id)}
            />
          </TabsContent>

          {/* Clients & Loyalty Tab (merged) */}
          <TabsContent value="clients-loyalty" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <ClientsLoyaltyTab
              customers={customers}
              translate={translate}
              setShowCustomerDialog={setShowCustomerDialog}
              onViewCustomerOrders={onViewCustomerOrders}
            />
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <SuppliersTab
              suppliers={suppliers}
              translate={translate}
              setShowSupplierDialog={setShowSupplierDialog}
            />
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai" className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <h2 className="text-2xl font-bold">Insights AlimentÃ©s par l'IA</h2>

            {/* Sales Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  PrÃ©visions des Ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesForecast ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Semaine Prochaine</p>
                        <p className="text-2xl font-bold">{salesForecast.week?.toFixed(2)} DZD</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Mois Prochain</p>
                        <p className="text-2xl font-bold">{salesForecast.month?.toFixed(2)} DZD</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {salesForecast.trend === "up" ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : salesForecast.trend === "down" ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        Tendance:{" "}
                        {salesForecast.trend === "up" ? "Hausse" : salesForecast.trend === "down" ? "Baisse" : "Stable"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">DonnÃ©es insuffisantes pour les prÃ©visions</p>
                )}
              </CardContent>
            </Card>

            {/* Inventory Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recommandations de RÃ©approvisionnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryRecommendations.length > 0 ? (
                  <div className="space-y-3">
                    {inventoryRecommendations.map((rec) => (
                      <div key={rec.productId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{rec.productName}</p>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                        <Badge>Commander {rec.recommendedQuantity}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune recommandation pour le moment</p>
                )}
              </CardContent>
            </Card>

            {/* Product Bundles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Suggestions de Bundles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productBundles.length > 0 ? (
                  <div className="space-y-3">
                    {productBundles.map((bundle, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium mb-2">Bundle #{index + 1}</p>
                        <p className="text-sm text-muted-foreground mb-2">AchetÃ© ensemble {bundle.frequency} fois</p>
                        <Badge variant="secondary">Remise suggÃ©rÃ©e: {bundle.suggestedDiscount}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune suggestion de bundle pour le moment</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Web-only: public storefront domains (vendor + per-store) */}
          <TabsContent value="storefront" className="space-y-6 pb-8">
            <VendorStorefrontWebPanel
              translate={translate}
              vendorId={domainVendorId}
              onConfigureVendorDomain={() => {
                setActiveTab("settings")
                setSettingsSubTab("security")
              }}
            />
          </TabsContent>

          {/* Settings Tab â€” nested sub-tabs */}
          <TabsContent value="settings" className="space-y-4 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
            <h2 className="text-2xl font-bold">{translate("ParamÃ¨tres", "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª")}</h2>

            <Tabs value={settingsSubTab} onValueChange={setSettingsSubTab} className="w-full gap-4">
              <TabsList className="mb-1 grid h-auto w-full max-w-full min-h-9 grid-cols-1 gap-1 p-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-start">
                <TabsTrigger value="shop" className="gap-1.5 px-2 sm:flex-none">
                  <Store className="size-4 shrink-0" />
                  <span className="truncate">{translate("Boutique", "Ø§Ù„Ù…ØªØ¬Ø±")}</span>
                </TabsTrigger>
                <TabsTrigger value="display" className="gap-1.5 px-2 sm:flex-none">
                  <Receipt className="size-4 shrink-0" />
                  <span className="truncate">{translate("Affichage & reÃ§us", "Ø§Ù„Ø¹Ø±Ø¶ ÙˆØ§Ù„Ø¥ÙŠØµØ§Ù„Ø§Øª")}</span>
                </TabsTrigger>
                <TabsTrigger value="devices" className="gap-1.5 px-2 sm:flex-none">
                  <Printer className="size-4 shrink-0" />
                  <span className="truncate">{translate("MatÃ©riel", "Ø§Ù„Ø£Ø¬Ù‡Ø²Ø©")}</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-1.5 px-2 sm:flex-none">
                  <Users className="size-4 shrink-0" />
                  <span className="truncate">{translate("Ã‰quipe & commandes", "Ø§Ù„ÙØ±ÙŠÙ‚ ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª")}</span>
                </TabsTrigger>
                <TabsTrigger value="hours" className="gap-1.5 px-2 sm:flex-none">
                  <Clock className="size-4 shrink-0" />
                  <span className="truncate">{translate("Horaires & prÃ©paration", "Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ ÙˆØ§Ù„ØªØ­Ø¶ÙŠØ±")}</span>
                </TabsTrigger>
                <TabsTrigger value="finance" className="gap-1.5 px-2 sm:flex-none">
                  <Wallet className="size-4 shrink-0" />
                  <span className="truncate">{translate("Paiements", "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª")}</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5 px-2 sm:flex-none">
                  <Shield className="size-4 shrink-0" />
                  <span className="truncate text-left leading-tight sm:max-w-[10rem]">
                    {translate(
                      "SÃ©curitÃ©, clÃ©s d'accÃ¨s & vitrine en ligne",
                      "Ø§Ù„Ø£Ù…Ø§Ù† ÙˆØ§Ù„Ù…ÙØ§ØªÙŠØ­ ÙˆØ§Ù„ÙˆØ§Ø¬Ù‡Ø©",
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="shop" className="mt-4 space-y-6 outline-none">
            {/* Shop Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {translate("Informations de la boutique", "Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…ØªØ¬Ø±")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{translate("Nom de la boutique", "Ø§Ø³Ù… Ø§Ù„Ù…ØªØ¬Ø±")}</Label>
                    <Input 
                      placeholder={translate("Entrez le nom de votre boutique", "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ù…ØªØ¬Ø±Ùƒ")}
                      value={shopInfo.name}
                      onChange={(e) => handleShopInfoChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("NumÃ©ro de tÃ©lÃ©phone", "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ")}</Label>
                    <Input 
                      type="tel"
                      placeholder="+213 XX XXX XXXX"
                      value={shopInfo.phone}
                      onChange={(e) => handleShopInfoChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Email", "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ")}</Label>
                    <Input 
                      type="email"
                      placeholder="shop@example.com"
                      value={shopInfo.email}
                      onChange={(e) => handleShopInfoChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Adresse", "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†")}</Label>
                    <Input 
                      placeholder={translate("Adresse de la boutique", "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…ØªØ¬Ø±")}
                      value={shopInfo.address}
                      onChange={(e) => handleShopInfoChange("address", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{translate("Description", "Ø§Ù„ÙˆØµÙ")}</Label>
                  <Textarea 
                    placeholder={translate("DÃ©crivez votre boutique...", "ØµÙ Ù…ØªØ¬Ø±Ùƒ...")}
                    rows={3}
                    value={shopInfo.description}
                    onChange={(e) => handleShopInfoChange("description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{translate("Logo (affichÃ© sur les reÃ§us)", "Ø§Ù„Ø´Ø¹Ø§Ø± (ÙŠØ¸Ù‡Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø¥ÙŠØµØ§Ù„Ø§Øª)")}</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleShopImageChange("logo", e.target.files?.[0] || null)}
                    />
                    {shopInfo.logo && (
                      <div className="h-20 w-full border rounded-md overflow-hidden">
                        <img src={shopInfo.logo} alt="Logo" className="h-full w-full object-contain bg-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Image de couverture", "ØµÙˆØ±Ø© Ø§Ù„ØºÙ„Ø§Ù")}</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleShopImageChange("cover", e.target.files?.[0] || null)}
                    />
                    {shopInfo.cover && (
                      <div className="h-20 w-full border rounded-md overflow-hidden">
                        <img src={shopInfo.cover} alt="Cover" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    onClick={handleSaveShopInfo}
                  >
                    {translate("Enregistrer les informations", "Ø­ÙØ¸ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShopInfo({ name: "", phone: "", email: "", address: "", description: "", logo: "", cover: "" })}
                  >
                    {translate("RÃ©initialiser", "Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø·")}
                  </Button>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="team" className="mt-4 space-y-6 outline-none">
          {featureFlags.orderPause && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {translate("Prise de commandes", "Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {translate(
                    "Activer ou mettre en pause la prise de commandes pour vos clients.",
                    "ØªÙØ¹ÙŠÙ„ Ø£Ùˆ Ø¥ÙŠÙ‚Ø§Ù Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡."
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {isAcceptingOrders ? translate("Commandes actives", "Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ù…ÙØ¹Ù„Ø©") : translate("Commandes en pause", "Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ù…ÙˆÙ‚ÙˆÙØ©")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isAcceptingOrders
                        ? translate("Les clients peuvent passer commande", "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙŠÙ…ÙƒÙ†Ù‡Ù… Ø§Ù„Ø·Ù„Ø¨")
                        : translate("Les nouvelles commandes sont bloquÃ©es", "Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ù…ÙˆÙ‚ÙˆÙØ©")}
                    </span>
                  </div>
                  <Button
                    variant={isAcceptingOrders ? "destructive" : "default"}
                    onClick={handleToggleAcceptingOrders}
                    disabled={isUpdatingStoreStatus}
                  >
                    {isUpdatingStoreStatus
                      ? translate("Mise Ã  jour...", "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ø¯ÙŠØ«...")
                      : isAcceptingOrders
                        ? translate("Mettre en pause", "Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª")
                        : translate("RÃ©activer", "Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªÙØ¹ÙŠÙ„")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Roles & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {translate("RÃ´les du personnel & permissions", "Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ø·Ø§Ù‚Ù… ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {translate(
                  "Choisissez un rÃ´le pour appliquer des limites en caisse (ex: remise max).",
                  "Ø§Ø®ØªØ± Ø¯ÙˆØ±Ø§Ù‹ Ù„ØªØ·Ø¨ÙŠÙ‚ Ø­Ø¯ÙˆØ¯ Ø¹Ù†Ø¯ Ø§Ù„Ø¯ÙØ¹ (Ù…Ø«Ù„ Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø®ØµÙ…)."
                )}
              </p>
              <div className="space-y-2">
                <Label>{translate("RÃ´le actif", "Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠ")}</Label>
                <select
                  className="border rounded-md px-3 py-2 bg-background"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                >
                  <option value="owner">{translate("PropriÃ©taire", "Ù…Ø§Ù„Ùƒ")}</option>
                  <option value="manager">{translate("Manager", "Ù…Ø¯ÙŠØ±")}</option>
                  <option value="cashier">{translate("Caissier", "Ø£Ù…ÙŠÙ† ØµÙ†Ø¯ÙˆÙ‚")}</option>
                </select>
              </div>
              <div className="rounded-md border px-3 py-2 bg-muted/40 text-sm">
                <p className="font-semibold">
                  {translate("Limites appliquÃ©es", "Ø§Ù„Ù‚ÙŠÙˆØ¯ Ø§Ù„Ù…Ø·Ø¨Ù‚Ø©")}
                </p>
                <p className="text-muted-foreground">
                  {translate(
                    `Remise max: ${staffRole === "cashier" ? "20%" : "90%"}.`,
                    `Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø®ØµÙ…: ${staffRole === "cashier" ? "20%" : "90%"}.`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff add is in Staff & Permissions tab (sidebar) */}
              </TabsContent>

              <TabsContent value="hours" className="mt-4 space-y-6 outline-none">

          {/* Schedule & Capacity â€” only for restaurant / grocery / other */}
          {isSettingsSectionVisible(shopType, "schedule") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {translate("Horaires & capacitÃ©", "Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ø¹Ù…Ù„ ÙˆØ§Ù„Ù‚Ø¯Ø±Ø©")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {translate(
                  "Planifiez vos horaires et limitez les ventes par heure pour Ã©viter la surcharge.",
                  "Ø§Ø¶Ø¨Ø· Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ø¹Ù…Ù„ ÙˆØ­Ø¯Ø¯ Ø¹Ø¯Ø¯ Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙÙŠ Ø§Ù„Ø³Ø§Ø¹Ø© Ù„ØªÙØ§Ø¯ÙŠ Ø§Ù„Ø¶ØºØ·."
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuSchedule.map((slot) => (
                  <div key={slot.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {slot.kind === "weekend"
                            ? translate("Week-end", "Ø¹Ø·Ù„Ø© Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹")
                            : translate("Lundi - Vendredi", "Ø§Ù„Ø¥Ø«Ù†ÙŠÙ† - Ø§Ù„Ø¬Ù…Ø¹Ø©")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.enabled
                            ? translate("Actif", "Ù…ÙØ¹Ù„")
                            : translate("DÃ©sactivÃ©", "Ù…Ø¹Ø·Ù„")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={slot.enabled ? "outline" : "default"}
                        onClick={() =>
                          setMenuSchedule((prev) =>
                            prev.map((s) =>
                              s.id === slot.id ? { ...s, enabled: !s.enabled } : s
                            )
                          )
                        }
                      >
                        {slot.enabled
                          ? translate("Mettre en pause", "Ø¥ÙŠÙ‚Ø§Ù")
                          : translate("Activer", "ØªÙØ¹ÙŠÙ„")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>{translate("DÃ©but", "Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©")}</Label>
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            setMenuSchedule((prev) =>
                              prev.map((s) =>
                                s.id === slot.id ? { ...s, start: e.target.value } : s
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>{translate("Fin", "Ø§Ù„Ù†Ù‡Ø§ÙŠØ©")}</Label>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            setMenuSchedule((prev) =>
                              prev.map((s) =>
                                s.id === slot.id ? { ...s, end: e.target.value } : s
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={autoPauseOutsideSchedule}
                    onChange={(e) => setAutoPauseOutsideSchedule(e.target.checked)}
                  />
                  <span>
                    {translate("Pause automatique hors horaires", "Ø¥ÙŠÙ‚Ø§Ù ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø®Ø§Ø±Ø¬ Ø§Ù„Ø³Ø§Ø¹Ø§Øª")}
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <Label>{translate("Max commandes / heure", "Ø£Ù‚ØµÙ‰ Ø§Ù„Ø·Ù„Ø¨Ø§Øª/Ø³Ø§Ø¹Ø©")}</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-28"
                    value={maxOrdersPerHour}
                    onChange={(e) => setMaxOrdersPerHour(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <Badge variant="secondary">
                    {translate("Restantes", "Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ©")}:{" "}
                    {Math.max(0, maxOrdersPerHour - trimRecentOrders(recentOrderTimestamps).length)}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMenuSchedule(defaultSchedule)}
                >
                  {translate("RÃ©initialiser les horaires", "Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø§Ù„Ø³Ø§Ø¹Ø§Øª")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecentOrderTimestamps([])}
                >
                  {translate("Vider le compteur horaire", "ØªØµÙÙŠØ± Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø³Ø§Ø¹Ø©")}
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Prep Time â€” only for restaurant / grocery / other */}
          {isSettingsSectionVisible(shopType, "prepTime") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {translate("Temps de prÃ©paration", "ÙˆÙ‚Øª Ø§Ù„ØªØ­Ø¶ÙŠØ±")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>{translate("Minutes moyennes de prÃ©paration", "Ù…ØªÙˆØ³Ø· Ø¯Ù‚Ø§Ø¦Ù‚ Ø§Ù„ØªØ­Ø¶ÙŠØ±")}</Label>
              <Input
                type="number"
                min={0}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value || "0", 10) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                {translate("UtilisÃ© pour calculer l'ETA affichÃ©e dans les commandes", "ÙŠØ³ØªØ®Ø¯Ù… Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ ÙÙŠ Ø§Ù„Ø·Ù„Ø¨Ø§Øª")}
              </p>
            </CardContent>
          </Card>
          )}
              </TabsContent>

              <TabsContent value="finance" className="mt-4 space-y-6 outline-none">

          <VendorSubscriptionTrialPanel
            variant="card"
            translate={translate}
            subscription={subscription}
            loading={subscriptionLoading}
            onUpdated={async () => {
              await refetchSubscription()
            }}
          />

          {/* Payouts & disputes (DB-backed via /api/vendor/finance/*) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {translate("Paiements et rÃ©clamations", "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ§Ù„Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payouts.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {translate("Aucune donnÃ©e de paiement pour le moment", "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø­Ø§Ù„ÙŠØ§Ù‹")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">{translate("PÃ©riode", "Ø§Ù„ÙØªØ±Ø©")}</th>
                        <th className="py-2 pr-4">{translate("Brut", "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ")}</th>
                        <th className="py-2 pr-4">{translate("Frais", "Ø§Ù„Ø±Ø³ÙˆÙ…")}</th>
                        <th className="py-2 pr-4">{translate("Net", "Ø§Ù„ØµØ§ÙÙŠ")}</th>
                        <th className="py-2 pr-4">{translate("Statut", "Ø§Ù„Ø­Ø§Ù„Ø©")}</th>
                        <th className="py-2 pr-4">{translate("Ã‰chÃ©ance", "ØªØ§Ø±ÙŠØ® Ø§Ù„ØµØ±Ù")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="border-t border-border/60">
                          <td className="py-2 pr-4">{payout.period}</td>
                          <td className="py-2 pr-4">{payout.gross.toLocaleString()} DZD</td>
                          <td className="py-2 pr-4">-{payout.fees.toLocaleString()} DZD</td>
                          <td className="py-2 pr-4 font-semibold">{payout.net.toLocaleString()} DZD</td>
                          <td className="py-2 pr-4">
                            <Badge variant={payout.status === "settled" ? "default" : "secondary"}>
                              {payout.status === "settled" ? translate("PayÃ©", "Ù…Ø¯ÙÙˆØ¹") : translate("En cours", "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©")}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4">{payout.eta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-border/60 pt-4">
                <h4 className="font-semibold mb-2">{translate("Soumettre une rÃ©clamation", "ØªÙ‚Ø¯ÙŠÙ… Ø§Ø¹ØªØ±Ø§Ø¶")}</h4>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmitDispute}>
                  <div className="space-y-2">
                    <Label>{translate("Payout concernÃ©", "Ø§Ù„Ø¯ÙØ¹Ø© Ø§Ù„Ù…Ø¹Ù†ÙŠØ©")}</Label>
                    <select
                      className="border rounded-md px-3 py-2 bg-background"
                      value={disputeForm.payoutId}
                      onChange={(e) => setDisputeForm((prev) => ({ ...prev, payoutId: e.target.value }))}
                      required
                    >
                      <option value="">{translate("SÃ©lectionner", "Ø§Ø®ØªÙŠØ§Ø±")}</option>
                      {payouts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} - {p.period}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("ID commande (optionnel)", "Ù…Ø¹Ø±Ù‘Ù Ø§Ù„Ø·Ù„Ø¨ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)")}</Label>
                    <Input
                      value={disputeForm.orderId}
                      onChange={(e) => setDisputeForm((prev) => ({ ...prev, orderId: e.target.value }))}
                      placeholder="ORDER-123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Montant contestÃ©", "Ø§Ù„Ù…Ø¨Ù„Øº Ù…Ø­Ù„ Ø§Ù„Ø§Ø¹ØªØ±Ø§Ø¶")}</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={disputeForm.amount}
                      onChange={(e) => setDisputeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{translate("Raison", "Ø§Ù„Ø³Ø¨Ø¨")}</Label>
                    <Textarea
                      required
                      value={disputeForm.reason}
                      onChange={(e) => setDisputeForm((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder={translate("Ex: frais incorrects, commande annulÃ©e, etc.", "Ù…Ø«Ø§Ù„: Ø±Ø³ÙˆÙ… ØºÙŠØ± ØµØ­ÙŠØ­Ø©ØŒ Ø·Ù„Ø¨ Ù…Ù„ØºÙŠ...")}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={isSubmittingDispute}>
                      {isSubmittingDispute ? translate("Envoi...", "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...") : translate("Soumettre", "Ø¥Ø±Ø³Ø§Ù„")}
                    </Button>
                  </div>
                </form>
                {disputes.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>{translate("RÃ©clamations rÃ©centes", "Ø§Ù„Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª Ø§Ù„Ø£Ø®ÙŠØ±Ø©")}:</p>
                    <ul className="list-disc list-inside">
                      {disputes.map((d) => (
                        <li key={d.id}>
                          {d.payoutId} - {d.reason} ({d.amount.toLocaleString()} DZD)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
              </TabsContent>

              <TabsContent value="display" className="mt-4 space-y-6 outline-none">

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {translate("Apparence", "Ø§Ù„Ù…Ø¸Ù‡Ø±")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{translate("Mode sombre", "Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ø¯Ø§ÙƒÙ†")}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate("Activer le thÃ¨me sombre", "ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø³Ù…Ø© Ø§Ù„Ø¯Ø§ÙƒÙ†Ø©")}
                    </p>
                  </div>
                  <Button
                    variant={isDarkMode ? "default" : "outline"}
                    onClick={() => {
                      const next = !isDarkMode
                      setLightDarkTheme(next)
                      setIsDarkMode(next)
                    }}
                  >
                    {isDarkMode ? translate("ActivÃ©", "Ù…ÙØ¹Ù„") : translate("DÃ©sactivÃ©", "Ù…Ø¹Ø·Ù„")}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{translate("Langue", "Ø§Ù„Ù„ØºØ©")}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate("Choisir la langue de l'interface", "Ø§Ø®ØªØ± Ù„ØºØ© Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={language === "fr" ? "default" : "outline"}
                      onClick={() => setLanguage("fr")}
                      size="sm"
                    >
                      FranÃ§ais
                    </Button>
                    <Button
                      variant={language === "ar" ? "default" : "outline"}
                      onClick={() => setLanguage("ar")}
                      size="sm"
                    >
                      Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  {translate("ParamÃ¨tres des reÃ§us", "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¥ÙŠØµØ§Ù„Ø§Øª")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{translate("Message de pied de page", "Ø±Ø³Ø§Ù„Ø© Ø§Ù„ØªØ°ÙŠÙŠÙ„")}</Label>
                  <Input 
                    placeholder={translate("Merci pour votre achat!", "Ø´ÙƒØ±Ø§Ù‹ Ù„ØªØ³ÙˆÙ‚ÙƒÙ…!")}
                    defaultValue=""
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{translate("Commandes WhatsApp", "Ø·Ù„Ø¨Ø§Øª ÙˆØ§ØªØ³Ø§Ø¨")}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate(
                        "Imprimer le reÃ§u automatiquement lorsque vous confirmez (acceptez) une commande provenant de WhatsApp.",
                        "Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„Ø¥ÙŠØµØ§Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¹Ù†Ø¯ ØªØ£ÙƒÙŠØ¯ (Ù‚Ø¨ÙˆÙ„) Ø·Ù„Ø¨ Ù‚Ø§Ø¯Ù… Ù…Ù† ÙˆØ§ØªØ³Ø§Ø¨.",
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={autoPrintWhatsappOnConfirm ? "default" : "outline"}
                    onClick={() => setAutoPrintWhatsappOnConfirm(!autoPrintWhatsappOnConfirm)}
                    className={autoPrintWhatsappOnConfirm ? "bg-albaz-green-gradient hover:opacity-90 text-white shrink-0" : "shrink-0"}
                  >
                    {autoPrintWhatsappOnConfirm ? translate("ActivÃ©", "Ù…ÙØ¹Ù‘Ù„") : translate("DÃ©sactivÃ©", "Ù…Ø¹Ø·Ù‘Ù„")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product labels / Ã‰tiquettes produit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  {translate("Ã‰tiquettes produit", "Ù…Ù„ØµÙ‚Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {translate("Choisissez les champs Ã  afficher sur l'Ã©tiquette et le type (RFID ou normal).", "Ø§Ø®ØªØ± Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø¹Ø±ÙˆØ¶Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù„ØµÙ‚ ÙˆØ§Ù„Ù†ÙˆØ¹ (RFID Ø£Ùˆ Ø¹Ø§Ø¯ÙŠ).")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">{translate("Champs sur l'Ã©tiquette", "Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù„ØµÙ‚")}</Label>
                  <div className="flex flex-wrap gap-3">
                    {LABEL_FIELD_OPTIONS.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={labelFields.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setLabelFields((prev) => [...prev, opt.id])
                            else setLabelFields((prev) => prev.filter((f) => f !== opt.id))
                          }}
                          className="rounded border-input"
                        />
                        <span>{translate(opt.labelFr, opt.labelAr)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">{translate("Type d'Ã©tiquette", "Ù†ÙˆØ¹ Ø§Ù„Ù…Ù„ØµÙ‚")}</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="labelType"
                        checked={labelType === 'normal'}
                        onChange={() => setLabelType('normal')}
                        className="border-input"
                      />
                      <span>{translate("Normal (code-barres)", "Ø¹Ø§Ø¯ÙŠ (Ø¨Ø§Ø±ÙƒÙˆØ¯)")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="labelType"
                        checked={labelType === 'rfid'}
                        onChange={() => setLabelType('rfid')}
                        className="border-input"
                      />
                      <span>RFID</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">{translate("Largeur (mm)", "Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ù…)")}</Label>
                    <Input
                      type="number"
                      min={20}
                      max={200}
                      value={labelWidthMm}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (Number.isFinite(v) && v >= 20 && v <= 200) setLabelWidthMm(v)
                      }}
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{translate("Hauteur (mm)", "Ø§Ù„Ø§Ø±ØªÙØ§Ø¹ (Ù…Ù…)")}</Label>
                    <Input
                      type="number"
                      min={15}
                      max={150}
                      value={labelHeightMm}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (Number.isFinite(v) && v >= 15 && v <= 150) setLabelHeightMm(v)
                      }}
                      className="w-24"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {translate("Utilisez l'icÃ´ne Ã©tiquette dans l'onglet Inventaire (Actions) pour imprimer une Ã©tiquette par produit.", "Ø§Ø³ØªØ®Ø¯Ù… Ø£ÙŠÙ‚ÙˆÙ†Ø© Ø§Ù„Ù…Ù„ØµÙ‚ ÙÙŠ ØªØ¨ÙˆÙŠØ¨ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† (Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª) Ù„Ø·Ø¨Ø§Ø¹Ø© Ù…Ù„ØµÙ‚ Ù„ÙƒÙ„ Ù…Ù†ØªØ¬.")}
                </p>
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="devices" className="mt-4 space-y-6 outline-none">
            {!isElectronRuntime && (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4">
                {translate(
                  "Imprimantes, mise Ã  jour de l'app et port sÃ©rie sont disponibles dans l'application bureau (Electron).",
                  "Ø§Ù„Ø·Ø§Ø¨Ø¹Ø§Øª ÙˆØªØ­Ø¯ÙŠØ« Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ ÙˆØ§Ù„Ù…Ù†ÙØ° Ø§Ù„ØªØ³Ù„Ø³Ù„ÙŠ Ù…ØªÙˆÙØ±Ø© ÙÙŠ ØªØ·Ø¨ÙŠÙ‚ Ø³Ø·Ø­ Ø§Ù„Ù…ÙƒØªØ¨.",
                )}
              </p>
            )}
            <VendorPrinterSettingsCard
              translate={translate}
              isElectronRuntime={isElectronRuntime}
              showLabelPrinter={vendorFeatures.labelPrinting}
            />

            {isElectronRuntime && <AppUpdateCard translate={translate} toast={toast} />}

            {/* Serial port (Electron only) */}
            {isElectronRuntime && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cable className="w-5 h-5" />
                    {translate("Port sÃ©rie", "Ø§Ù„Ù…Ù†ÙØ° Ø§Ù„ØªØ³Ù„Ø³Ù„ÙŠ")}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {translate("Choisissez le port sÃ©rie du lecteur code-barres ou RFID (connexion directe).", "Ø§Ø®ØªØ± Ø§Ù„Ù…Ù†ÙØ° Ø§Ù„ØªØ³Ù„Ø³Ù„ÙŠ Ù„Ù‚Ø§Ø±Ø¦ Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ø£Ùˆ RFID (Ø§ØªØµØ§Ù„ Ù…Ø¨Ø§Ø´Ø±).")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm">{translate("Port", "Ø§Ù„Ù…Ù†ÙØ°")}</Label>
                      <select
                        value={selectedSerialPort}
                        onChange={(e) => handleSerialPortChange(e.target.value)}
                        disabled={loadingSerialPorts}
                        className="flex h-9 w-full max-w-full sm:w-[220px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">{translate("Aucun", "Ù„Ø§ Ø´ÙŠØ¡")}</option>
                        {serialPortsList.map((p) => (
                          <option key={p.path} value={p.path}>
                            {p.path}{p.manufacturer ? ` (${p.manufacturer})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={refreshSerialPorts} disabled={loadingSerialPorts}>
                      {loadingSerialPorts ? translate("Chargementâ€¦", "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„â€¦") : translate("RafraÃ®chir", "ØªØ­Ø¯ÙŠØ«")}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{translate("Vitesse (baud)", "Ø§Ù„Ø³Ø±Ø¹Ø© (Ø¨Ø§ÙˆØ¯)")}</Label>
                    <select
                      value={serialBaudRate}
                      onChange={(e) => handleSerialBaudChange(Number(e.target.value))}
                      className="flex h-9 w-full max-w-full sm:w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {BAUD_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}
              </TabsContent>

              <TabsContent value="security" className="mt-4 outline-none">
                <VendorSecuritySettingsPanel
                  translate={translate}
                  isElectronRuntime={isElectronRuntime}
                  managedVendorId={domainVendorId}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

      </VendorShell>

      <NotificationsPanel
        open={showNotificationsPanel}
        notifications={notifications}
        translate={translate}
        onOpenChange={setShowNotificationsPanel}
        onMarkAllRead={markAllNotificationsRead}
      />

      <StaffSwitchDialog
        open={showStaffSwitchDialog}
        onOpenChange={setShowStaffSwitchDialog}
        translate={translate}
        onSubmit={handleSwitchStaff}
      />

      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {translate("Raccourcis clavier", "Ø§Ø®ØªØµØ§Ø±Ø§Øª Ù„ÙˆØ­Ø© Ø§Ù„Ù…ÙØ§ØªÙŠØ­")}
            </DialogTitle>
            <DialogDescription>
              {translate(
                "Astuce: appuyez sur ? pour ouvrir cette aide, puis utilisez Ctrl+Shift+<lettre> pour naviguer.",
                "Ù†ØµÙŠØ­Ø©: Ø§Ø¶ØºØ· ? Ù„ÙØªØ­ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø©ØŒ Ø«Ù… Ø§Ø³ØªØ®Ø¯Ù… Ctrl+Shift+<Ø­Ø±Ù> Ù„Ù„ØªÙ†Ù‚Ù„.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1">
            {shortcutItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm"
              >
                <span>{translate(item.labelFr, item.labelAr)}</span>
                <kbd className="rounded border bg-background px-2 py-1 text-xs font-semibold">
                  {item.shortcut}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Success Dialog */}
      <SaleSuccessDialog
        open={showSaleSuccessDialog}
        onOpenChange={setShowSaleSuccessDialog}
        onClose={() => {
          setShowSaleSuccessDialog(false)
          setCompletedSale(null)
        }}
        onPrint={() => {
          setShowSaleSuccessDialog(false)
          setShowReceipt(true)
        }}
        translate={translate}
      />

      {/* Receipt View */}
      <ReceiptView
        showReceipt={showReceipt}
        completedSale={completedSale}
        user={effectiveUser}
        translate={translate}
        isElectronRuntime={isElectronRuntime}
        onClose={() => {
          setShowReceipt(false)
          setCompletedSale(null)
        }}
        shopInfo={shopInfo}
        onPrint={async () => {
          if (!completedSale) return
          const userWithExtras = effectiveUser as any
          const electronAPI = window.electronAPI
          if (isElectronRuntime && electronAPI?.print?.receipt) {
            try {
              const receiptData = {
                storeName: shopInfo.name || effectiveUser?.name || 'AlBaz Store',
                items: completedSale.items.map(item => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: item.price
                })),
                subtotal: completedSale.subtotal,
                discount: completedSale.discount || 0,
                tax: (completedSale as any).tax || 0,
                total: completedSale.total,
                paymentMethod: completedSale.paymentMethod,
                orderNumber: completedSale.id.slice(0, 8),
                date: new Date(completedSale.createdAt).toLocaleString(),
                shopAddress: shopInfo.address || userWithExtras?.address || '',
                shopPhone: shopInfo.phone || userWithExtras?.phone || '',
                shopEmail: shopInfo.email || effectiveUser?.email || '',
                shopCity: '',
                logo: shopInfo.logo,
                deviceName: getVendorPrinterDevice(VENDOR_PRINTER_POS_KEY) || undefined,
              }
              await electronAPI.print.receipt(receiptData)
            } catch (error) {
              console.error('Error printing receipt:', error)
              window.print()
            }
          } else {
            window.print()
          }
        }}
      />

      {/* Product Dialog */}
      <ProductDialog
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        productForm={productForm}
        onFormChange={setProductForm}
        editingProduct={editingProduct}
        onSave={handleSaveProduct}
        onFileUpload={handleFileUpload}
        onScanBarcode={() => {
          productFormScanRef.current = true
          setIsBarcodeScannerOpen(true)
        }}
        translate={translate}
      />

      {/* Customer Dialog */}
      <CustomerDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        customerForm={customerForm}
        onFormChange={setCustomerForm}
        onSave={handleSaveCustomer}
        translate={translate}
      />

      {/* Supplier Dialog */}
      <SupplierDialog
        open={showSupplierDialog}
        onOpenChange={setShowSupplierDialog}
        supplierForm={supplierForm}
        onFormChange={setSupplierForm}
        onSave={handleSaveSupplier}
        translate={translate}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        lastSale={lastSale}
        translate={translate}
      />

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={showImageUploadDialog}
        onOpenChange={setShowImageUploadDialog}
        onFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
        translate={translate}
      />

      {/* Barcode Scanner (used by POS and Add Product dialog) */}
      <BarcodeScannerDialog
        open={isBarcodeScannerOpen}
        onOpenChange={setIsBarcodeScannerOpen}
        videoRef={barcodeVideoRef}
        error={barcodeScannerError}
        translate={translate}
      />
    </>
  )
}

export default function VendorDashboard() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VendorDashboardContent />
    </Suspense>
  )
}
