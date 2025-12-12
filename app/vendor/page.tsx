"use client"

import { useState, useEffect, useMemo, useRef, useCallback, FormEvent } from "react"
import type { ChangeEvent } from "react"
import { useRouter } from "next/navigation"
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
  AlertCircle
} from "lucide-react"

// UI Components
import { Button } from "@/root/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Textarea } from "@/root/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import VendorSidebar from "@/root/components/VendorSidebar"
import ElectronLogin from "@/root/components/ElectronLogin"
import { ReceiptView } from "../../components/ReceiptView"
import { POSView } from "../../components/POSView"
import { ProductDialog } from "../../components/dialogs/ProductDialog"
import { CustomerDialog } from "../../components/dialogs/CustomerDialog"
import { SupplierDialog } from "../../components/dialogs/SupplierDialog"
import { DashboardTab } from "../../components/tabs/DashboardTab"
import { InventoryTab } from "../../components/tabs/InventoryTab"
import { OrdersTab } from "../../components/tabs/OrdersTab"
import { DriversTab } from "../../components/tabs/DriversTab"
import { SalesTab } from "../../components/tabs/SalesTab"
import { CustomersTab } from "../../components/tabs/CustomersTab"
import { SuppliersTab } from "../../components/tabs/SuppliersTab"
import { AITab } from "../../components/tabs/AITab"
import { SettingsTab } from "../../components/tabs/SettingsTab"
import { SaleSuccessDialog } from "../../components/dialogs/SaleSuccessDialog"
import { ReceiptDialog } from "../../components/dialogs/ReceiptDialog"
import { ImageUploadDialog } from "../../components/dialogs/ImageUploadDialog"

// Hooks
// Use custom hooks
import { useAuth } from "@/hooks/use-auth"
import { useDashboardData } from "./fetch-data"
import { fetchDashboardData, fetchInventory } from "./refresh-data"
import { usePOSCart } from "../../hooks/usePOSCart"
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner"
import { saveProduct, deleteProduct, postProductToDelivery } from "@/utils/productUtils"
import { saveCustomer } from "@/utils/customerUtils"
import { saveSupplier } from "@/utils/supplierUtils"
import { updateOrderStatus } from "@/utils/orderUtils"
import { completeSale as completeSaleUtil } from "@/utils/saleUtils"
import { resetProductForm, resetCustomerForm } from "@/utils/formUtils"
import { handleFileUpload as handleFileUploadUtil } from "@/utils/fileUtils"
import { handleDataLoad as handleDataLoadUtil } from "@/utils/dataUtils"
import { fetchDrivers as fetchDriversUtil, respondToDriverRequest as respondToDriverRequestUtil } from "@/utils/driverUtils"
import { fetchAIInsights as fetchAIInsightsUtil } from "@/utils/aiUtils"
import { useDataLoading } from "../../hooks/useDataLoading"
import { usePOSHandlers } from "../../hooks/usePOSHandlers"
import { AdminVendorSelector } from "../../components/AdminVendorSelector"
import { LoadingScreen } from "../../components/LoadingScreen"
import { useVendorState } from "../../hooks/useVendorState"
import { loadElectronOfflineData } from "@/utils/electronUtils"
import { ErrorBoundary } from "../../components/ErrorBoundary"

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

export default function VendorDashboard() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading, status } = useAuth()
  const { toast } = useToast()
  
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
  } = useVendorState()

  const [storeId, setStoreId] = useState<string | null>(null)
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true)
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState(false)
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(() => {
    if (typeof window === 'undefined') return 20
    const stored = parseInt(localStorage.getItem('vendor-prep-minutes') || '20', 10)
    return Number.isNaN(stored) ? 20 : stored
  })
  const [payouts] = useState(() => [
    { id: 'PAYOUT-001', period: 'Cette semaine', gross: 125000, fees: 2500, net: 122500, status: 'pending', eta: 'Vendredi' },
    { id: 'PAYOUT-000', period: 'Semaine dernière', gross: 98000, fees: 2000, net: 96000, status: 'settled', eta: 'Déjà payé' },
  ])
  const [disputes, setDisputes] = useState<Array<{ id: string; payoutId: string; orderId: string; reason: string; amount: number }>>([])
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
  const featureFlags = useMemo(() => ({
    orderPause: true,
    prepTimeEta: true,
    payoutStub: true,
    offlineQueue: true,
  }), [])

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

  // Load vendor store info to control intake/pause
  useEffect(() => {
    const targetVendorId = isAdmin ? activeVendorId : user?.id
    if (!targetVendorId) return

    const controller = new AbortController()
    const loadStore = async () => {
      try {
        const res = await fetch(`/api/stores?vendorId=${targetVendorId}&includeInactive=true&limit=1`, {
          signal: controller.signal,
        })
        const data = await res.json()
        const stores = data?.data?.stores || data?.stores || []
        if (stores.length > 0) {
          setStoreId(stores[0].id)
          setIsAcceptingOrders(stores[0].isActive !== false)
        }
      } catch (error) {
        console.warn('[Vendor] Failed to load store info', error)
      }
    }

    loadStore()
    return () => controller.abort()
  }, [user?.id, activeVendorId, isAdmin])

  // Persist prep time
  useEffect(() => {
    try {
      localStorage.setItem('vendor-prep-minutes', prepTimeMinutes.toString())
    } catch (error) {
      console.warn('[Vendor] Failed to persist prep time', error)
    }
  }, [prepTimeMinutes])

  const refreshOfflineQueueCount = useCallback(() => {
    if (typeof window === 'undefined') return
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
        fetchSales(activeVendorId)
        toast({
          title: translate("Ventes synchronisées", "تمت مزامنة المبيعات"),
          description: translate(
            `${syncedCount} vente(s) ont été envoyées`,
            `تم إرسال ${syncedCount} عملية بيع`
          ),
        })
      }
    } catch (error) {
      console.warn("[POS] Failed to sync offline queue automatically", error)
    }
  }, [activeVendorId, fetchDashboardData, fetchInventory, fetchSales, isElectronRuntime, setOfflineQueueCount, toast, translate])

  useEffect(() => {
    syncOfflineSales()
    const handleOnline = () => syncOfflineSales()
    window.addEventListener("online", handleOnline)
    const interval = setInterval(syncOfflineSales, 15000)

    return () => {
      window.removeEventListener("online", handleOnline)
      clearInterval(interval)
    }
  }, [syncOfflineSales])

  const handleToggleAcceptingOrders = useCallback(async () => {
    if (!storeId) {
      toast({
        title: translate("Boutique introuvable", "المتجر غير متاح"),
        description: translate("Impossible de changer l'état des commandes", "لا يمكن تغيير حالة الطلبات"),
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
        title: next ? translate("Commandes réactivées", "تم تفعيل الطلبات") : translate("Commandes mises en pause", "تم إيقاف الطلبات"),
        description: next ? translate("Les clients peuvent commander", "يمكن للزبائن الطلب الآن") : translate("Les nouvelles commandes sont bloquées", "تم إيقاف الطلبات الجديدة"),
      })
    } catch (error) {
      console.error('[Vendor] Failed to toggle orders:', error)
      setIsAcceptingOrders(!next)
      toast({
        title: translate("Échec de la mise à jour", "فشل التحديث"),
        description: translate("Réessayez ou contactez le support", "أعد المحاولة أو اتصل بالدعم"),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStoreStatus(false)
    }
  }, [storeId, isAcceptingOrders, toast, translate])

  const handleSubmitDispute = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    const amountValue = parseFloat(disputeForm.amount || '0')
    if (!disputeForm.reason || !disputeForm.payoutId || Number.isNaN(amountValue)) {
      toast({
        title: translate("Informations manquantes", "المعلومات ناقصة"),
        description: translate("Sélectionnez un paiement et un montant", "اختر دفعة ومبلغاً"),
        variant: "destructive",
      })
      return
    }

    setIsSubmittingDispute(true)
    try {
      setDisputes((prev) => [
        ...prev,
        {
          id: `DISP-${Date.now()}`,
          payoutId: disputeForm.payoutId,
          orderId: disputeForm.orderId,
          reason: disputeForm.reason,
          amount: amountValue,
        },
      ])
      setDisputeForm({ payoutId: '', orderId: '', reason: '', amount: '' })
      toast({
        title: translate("Réclamation enregistrée", "تم تسجيل الاعتراض"),
        description: translate("Nous traiterons votre demande", "سنعالج طلبك"),
      })
    } catch (error) {
      toast({
        title: translate("Échec de l'envoi", "فشل الإرسال"),
        description: translate("Réessayez ou contactez le support", "أعد المحاولة أو اتصل بالدعم"),
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
    addToCart,
    addCustomItemToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
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
    onBarcodeScanned: setPosSearch,
    translate,
  })


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
    [fetchSales, fetchOrders, fetchProducts, fetchCustomers, fetchSuppliers, fetchCategories, setSales, setOrders, setProducts, setLowStockProducts, setCustomers, setSuppliers, setCategories, setTodaySales, setWeekSales, setMonthSales, setTopProducts, setLoadingState, toast, translate]
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
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await updateOrderStatus({
      orderId,
      status,
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

  // Delete Product - using utility function
  const handleDeleteProduct = async (id: number) => {
    if (!confirm(translate("Êtes-vous sûr de vouloir supprimer ce produit?", "هل أنت متأكد من حذف هذا المنتج؟"))) return
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

  // Complete Sale - using utility function
  const completeSale = async (paymentMethod: "cash" | "card") => {
    await completeSaleUtil({
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
      setPosCustomerId,
      setPosOrderNumber,
      fetchDashboardData,
      fetchInventory,
      fetchSales,
      toast,
      translate,
      isArabic,
      setOfflineQueueCount,
    })
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
    user,
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

  // Show loading state while checking authentication
  if (isLoading || status === "loading") {
    return <LoadingScreen />
  }
  
  // Redirect if not authenticated (handled in useEffect, but show nothing while redirecting)
  // Skip auth check in Electron for development
  if (!isElectronRuntime && (!isAuthenticated || !user)) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-background flex ${isDarkMode ? 'dark' : ''}`} dir={isArabic ? "rtl" : "ltr"}>
      {/* Vertical Sidebar */}
      <VendorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        translate={translate}
      />

      {/* Main Content */}
      <main className="flex-1 w-full transition-all duration-300 pl-0 md:pl-[70px] pb-20 md:pb-0 min-w-0 overflow-x-auto" dir={isArabic ? "rtl" : "ltr"}>
        <div className="w-full h-full px-2 sm:px-4 py-4 sm:py-6">
          <AdminVendorSelector
            isAdmin={isAdmin}
            selectedVendorId={selectedVendorId}
            setSelectedVendorId={setSelectedVendorId}
            availableVendors={availableVendors}
            isLoadingVendors={isLoadingVendors}
            translate={translate}
          />
        
        {/* Topbar removed — navigation is handled by the left sidebar */}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Horizontal tabs removed - navigation now in vertical sidebar */}

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
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
          <TabsContent value="pos" className="space-y-0 p-0 -mx-2 sm:-mx-4">
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
              onDiscountPercentChange={handleDiscountPercentChange}
              onTaxPercentChange={handleTaxPercentChange}
              onKeypadKey={handleKeypadKey}
              onClearDiscount={handleClearDiscount}
              onClearCart={handleClearCart}
              onManualTotalChange={handleManualTotalChange}
              onAddCustomItem={addCustomItemToCart}
              onCompleteSale={completeSale}
            />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <InventoryTab
              products={products}
              isElectronRuntime={isElectronRuntime}
              activeVendorId={activeVendorId}
              isArabic={isArabic}
              translate={translate}
              toast={toast}
              setProducts={setProducts}
              setLowStockProducts={setLowStockProducts}
              setShowProductDialog={setShowProductDialog}
              setEditingProduct={setEditingProduct}
              setProductForm={setProductForm}
              setSelectedProductForImage={setSelectedProductForImage}
              setShowImageUploadDialog={setShowImageUploadDialog}
              fetchProducts={fetchProducts}
              handlePostProductToDelivery={handlePostProductToDelivery}
              handleDeleteProduct={handleDeleteProduct}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <OrdersTab
              orders={orders}
              loadingState={loadingState}
              translate={translate}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              prepTimeMinutes={prepTimeMinutes}
            />
          </TabsContent>


          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <DriversTab
              loadingDrivers={loadingDrivers}
              pendingDriverRequests={pendingDriverRequests}
              connectedDrivers={connectedDrivers}
              translate={translate}
              respondToDriverRequest={respondToDriverRequest}
            />
          </TabsContent>

          {/* Drivers Tab - Extracted */}
          <TabsContent value="drivers-old" className="hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {translate("Gestion des Chauffeurs", "إدارة السائقين")}
              </h2>
            </div>

            {loadingDrivers ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Pending Requests */}
                {pendingDriverRequests.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        {translate("Demandes en attente", "الطلبات المعلقة")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {pendingDriverRequests.map((request: any) => (
                          <Card key={request.id} className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                                    {request.driver?.name?.charAt(0) || "D"}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">{request.driver?.name || "N/A"}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {translate("Téléphone", "الهاتف")}: {request.driver?.phone || "N/A"}
                                    </p>
                                    {request.driver?.vehicleType && (
                                      <p className="text-sm text-muted-foreground">
                                        {translate("Véhicule", "المركبة")}: {request.driver.vehicleType}
                                      </p>
                                    )}
                                    {request.driver?.licenseNumber && (
                                      <p className="text-sm text-muted-foreground">
                                        {translate("Permis", "الترخيص")}: {request.driver.licenseNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    className="bg-albaz-green-gradient hover:opacity-90 text-white"
                                    onClick={() => respondToDriverRequest(request.connectionId, "accept")}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {translate("Accepter", "قبول")}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => respondToDriverRequest(request.connectionId, "reject")}
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    {translate("Refuser", "رفض")}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Connected Drivers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-green-500" />
                      {translate("Chauffeurs connectés", "السائقون المتصلون")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {connectedDrivers.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground">
                          {translate("Aucun chauffeur connecté", "لا يوجد سائقون متصلون")}
                        </p>
                        {pendingDriverRequests.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {translate("Les demandes de connexion apparaîtront ici", "ستظهر طلبات الاتصال هنا")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {connectedDrivers.map((connection: any) => (
                          <Card key={connection.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                                  {connection.driver?.name?.charAt(0) || "D"}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{connection.driver?.name || "N/A"}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {translate("Téléphone", "الهاتف")}: {connection.driver?.phone || "N/A"}
                                  </p>
                                  {connection.driver?.vehicleType && (
                                    <p className="text-sm text-muted-foreground">
                                      {translate("Véhicule", "المركبة")}: {connection.driver.vehicleType}
                                    </p>
                                  )}
                                  {connection.driver?.licenseNumber && (
                                    <p className="text-sm text-muted-foreground">
                                      {translate("Permis", "الترخيص")}: {connection.driver.licenseNumber}
                                    </p>
                                  )}
                                  <Badge className="mt-2 bg-green-500">
                                    {translate("Connecté", "متصل")}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Sales History Tab */}
          <TabsContent value="sales" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <SalesTab
              sales={sales}
              translate={translate}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <CustomersTab
              customers={customers}
              translate={translate}
              setShowCustomerDialog={setShowCustomerDialog}
            />
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <SuppliersTab
              suppliers={suppliers}
              translate={translate}
              setShowSupplierDialog={setShowSupplierDialog}
            />
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <h2 className="text-2xl font-bold">Insights Alimentés par l'IA</h2>

            {/* Sales Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Prévisions des Ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesForecast ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-muted-foreground">Données insuffisantes pour les prévisions</p>
                )}
              </CardContent>
            </Card>

            {/* Inventory Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recommandations de Réapprovisionnement
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
                        <p className="text-sm text-muted-foreground mb-2">Acheté ensemble {bundle.frequency} fois</p>
                        <Badge variant="secondary">Remise suggérée: {bundle.suggestedDiscount}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune suggestion de bundle pour le moment</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
            <h2 className="text-2xl font-bold">{translate("Paramètres", "الإعدادات")}</h2>

            {/* Shop Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {translate("Informations de la boutique", "معلومات المتجر")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{translate("Nom de la boutique", "اسم المتجر")}</Label>
                    <Input 
                      placeholder={translate("Entrez le nom de votre boutique", "أدخل اسم متجرك")}
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Numéro de téléphone", "رقم الهاتف")}</Label>
                    <Input 
                      type="tel"
                      placeholder="+213 XX XXX XXXX"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Email", "البريد الإلكتروني")}</Label>
                    <Input 
                      type="email"
                      placeholder="shop@example.com"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{translate("Adresse", "العنوان")}</Label>
                    <Input 
                      placeholder={translate("Adresse de la boutique", "عنوان المتجر")}
                      defaultValue=""
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{translate("Description", "الوصف")}</Label>
                  <Textarea 
                    placeholder={translate("Décrivez votre boutique...", "صف متجرك...")}
                    rows={3}
                  />
                </div>
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                  {translate("Enregistrer les informations", "حفظ المعلومات")}
                </Button>
              </CardContent>
            </Card>

            {featureFlags.orderPause && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {translate("Prise de commandes", "استقبال الطلبات")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {translate(
                      "Activer ou mettre en pause la prise de commandes pour vos clients.",
                      "تفعيل أو إيقاف استقبال الطلبات للعملاء."
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {isAcceptingOrders ? translate("Commandes actives", "الطلبات مفعلة") : translate("Commandes en pause", "الطلبات موقوفة")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {isAcceptingOrders
                          ? translate("Les clients peuvent passer commande", "العملاء يمكنهم الطلب")
                          : translate("Les nouvelles commandes sont bloquées", "الطلبات الجديدة موقوفة")}
                      </span>
                    </div>
                    <Button
                      variant={isAcceptingOrders ? "destructive" : "default"}
                      onClick={handleToggleAcceptingOrders}
                      disabled={isUpdatingStoreStatus}
                    >
                      {isUpdatingStoreStatus
                        ? translate("Mise à jour...", "جاري التحديث...")
                        : isAcceptingOrders
                          ? translate("Mettre en pause", "إيقاف مؤقت")
                          : translate("Réactiver", "إعادة التفعيل")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {translate("Temps de préparation", "وقت التحضير")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>{translate("Minutes moyennes de préparation", "متوسط دقائق التحضير")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value || "0", 10) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  {translate("Utilisé pour calculer l'ETA affichée dans les commandes", "يستخدم لحساب الوقت المتوقع في الطلبات")}
                </p>
              </CardContent>
            </Card>

            {featureFlags.payoutStub && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    {translate("Paiements et réclamations", "المدفوعات والاعتراضات")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">{translate("Période", "الفترة")}</th>
                          <th className="py-2 pr-4">{translate("Brut", "الإجمالي")}</th>
                          <th className="py-2 pr-4">{translate("Frais", "الرسوم")}</th>
                          <th className="py-2 pr-4">{translate("Net", "الصافي")}</th>
                          <th className="py-2 pr-4">{translate("Statut", "الحالة")}</th>
                          <th className="py-2 pr-4">{translate("Échéance", "تاريخ الصرف")}</th>
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
                                {payout.status === "settled" ? translate("Payé", "مدفوع") : translate("En cours", "قيد المعالجة")}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4">{payout.eta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-border/60 pt-4">
                    <h4 className="font-semibold mb-2">{translate("Soumettre une réclamation", "تقديم اعتراض")}</h4>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmitDispute}>
                      <div className="space-y-2">
                        <Label>{translate("Payout concerné", "الدفعة المعنية")}</Label>
                        <select
                          className="border rounded-md px-3 py-2 bg-background"
                          value={disputeForm.payoutId}
                          onChange={(e) => setDisputeForm((prev) => ({ ...prev, payoutId: e.target.value }))}
                          required
                        >
                          <option value="">{translate("Sélectionner", "اختيار")}</option>
                          {payouts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.id} - {p.period}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>{translate("ID commande (optionnel)", "معرّف الطلب (اختياري)")}</Label>
                        <Input
                          value={disputeForm.orderId}
                          onChange={(e) => setDisputeForm((prev) => ({ ...prev, orderId: e.target.value }))}
                          placeholder="ORDER-123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{translate("Montant contesté", "المبلغ محل الاعتراض")}</Label>
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
                        <Label>{translate("Raison", "السبب")}</Label>
                        <Textarea
                          required
                          value={disputeForm.reason}
                          onChange={(e) => setDisputeForm((prev) => ({ ...prev, reason: e.target.value }))}
                          placeholder={translate("Ex: frais incorrects, commande annulée, etc.", "مثال: رسوم غير صحيحة، طلب ملغي...")}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" disabled={isSubmittingDispute}>
                          {isSubmittingDispute ? translate("Envoi...", "جاري الإرسال...") : translate("Soumettre", "إرسال")}
                        </Button>
                      </div>
                    </form>
                    {disputes.length > 0 && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>{translate("Réclamations récentes", "الاعتراضات الأخيرة")}:</p>
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
            )}

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {translate("Apparence", "المظهر")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{translate("Mode sombre", "الوضع الداكن")}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate("Activer le thème sombre", "تفعيل السمة الداكنة")}
                    </p>
                  </div>
                  <Button
                    variant={isDarkMode ? "default" : "outline"}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? translate("Activé", "مفعل") : translate("Désactivé", "معطل")}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{translate("Langue", "اللغة")}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate("Choisir la langue de l'interface", "اختر لغة الواجهة")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={language === "fr" ? "default" : "outline"}
                      onClick={() => setLanguage("fr")}
                      size="sm"
                    >
                      Français
                    </Button>
                    <Button
                      variant={language === "ar" ? "default" : "outline"}
                      onClick={() => setLanguage("ar")}
                      size="sm"
                    >
                      العربية
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
                  {translate("Paramètres des reçus", "إعدادات الإيصالات")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{translate("Message de pied de page", "رسالة التذييل")}</Label>
                  <Input 
                    placeholder={translate("Merci pour votre achat!", "شكراً لتسوقكم!")}
                    defaultValue=""
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{translate("Impression automatique", "الطباعة التلقائية")}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate("Imprimer automatiquement après chaque vente", "طباعة تلقائية بعد كل عملية بيع")}
                    </p>
                  </div>
                  <Button variant="outline">
                    {translate("Désactivé", "معطل")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>

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
        user={user}
        translate={translate}
        isElectronRuntime={isElectronRuntime}
        onClose={() => {
          setShowReceipt(false)
          setCompletedSale(null)
        }}
        onPrint={async () => {
          if (!completedSale) return
          const userWithExtras = user as any
          const electronAPI = window.electronAPI
          if (isElectronRuntime && electronAPI?.print?.receipt) {
            try {
              const receiptData = {
                storeName: user?.name || 'AlBaz Store',
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
                shopAddress: userWithExtras?.address || '',
                shopPhone: userWithExtras?.phone || '',
                shopEmail: user?.email || '',
                shopCity: ''
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
      </div>
    </ErrorBoundary>
  )
}
