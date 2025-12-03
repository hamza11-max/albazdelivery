"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
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
  // Calculate remaining cart values derived from subtotal
  const cartTax = useMemo(() => {
    const subtotalAfterDiscount = cartSubtotal - posDiscount
    return subtotalAfterDiscount * (posTaxPercent / 100) // Adjustable tax percentage
  }, [cartSubtotal, posDiscount, posTaxPercent])
  const cartTotal = cartSubtotal - posDiscount + cartTax
  
  // Update posTax when cart changes
  useEffect(() => {
    setPosTax(cartTax)
  }, [cartTax, setPosTax])

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
