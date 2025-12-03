"use client"

import { useState, useRef, useMemo, useCallback } from "react"
import type { InventoryProduct, Sale, Customer, Supplier, Order } from "@/root/lib/types"
import type { Category, TopProductData, SalesForecast, InventoryRecommendation, BundleRecommendation, ProductForm, CustomerForm, SupplierForm } from "../app/vendor/types"

export function useVendorState() {
  // Electron auth state
  const [electronUser, setElectronUser] = useState<any>(null)
  const [electronAuthChecked, setElectronAuthChecked] = useState(false)
  const isElectronRuntime = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

  // UI States
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vendor-dark-mode')
      return saved === 'true'
    }
    return false
  })
  const [activeTab, setActiveTab] = useState("dashboard")
  const [language, setLanguage] = useState("fr")
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  
  // Data States
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<InventoryProduct[]>([])
  
  // Drivers States
  const [connectedDrivers, setConnectedDrivers] = useState<any[]>([])
  const [pendingDriverRequests, setPendingDriverRequests] = useState<any[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  
  // Analytics States
  const [todaySales, setTodaySales] = useState(0)
  const [weekSales, setWeekSales] = useState(0)
  const [monthSales, setMonthSales] = useState(0)
  const [topProducts, setTopProducts] = useState<TopProductData[]>([])
  
  // Form States
  const [productForm, setProductForm] = useState<ProductForm>({
    sku: "",
    name: "",
    category: "",
    description: "",
    supplierId: "",
    costPrice: "",
    sellingPrice: "",
    price: "",
    stock: 0,
    lowStockThreshold: 0,
    barcode: "",
    image: ""
  })
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    name: "",
    email: "",
    phone: "",
    address: ""
  })
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: ""
  })

  // AI Insights States
  const [salesForecast, setSalesForecast] = useState<SalesForecast | null>(null)
  const [inventoryRecommendations, setInventoryRecommendations] = useState<InventoryRecommendation[]>([])
  const [productBundles, setProductBundles] = useState<BundleRecommendation[]>([])
  
  // Image Upload States
  const [selectedProductForImage, setSelectedProductForImage] = useState<number | null>(null)
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Sale States
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  
  // Admin States
  const [isAdmin, setIsAdmin] = useState(false)
  const [availableVendors, setAvailableVendors] = useState<Array<{ id: string; name: string }>>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)

  // Computed values
  const isArabic = useMemo(() => language === "ar", [language])
  const translate = useCallback(
    (fr: string, ar: string) => (language === "ar" ? ar : fr),
    [language]
  )
  const activeVendorId = useMemo(
    () => {
      // For Electron, use the electronUser's vendorId
      if (isElectronRuntime && electronUser?.vendorId) {
        return electronUser.vendorId
      }
      return isAdmin ? selectedVendorId ?? undefined : undefined
    },
    [isAdmin, selectedVendorId, isElectronRuntime, electronUser]
  )

  return {
    // Electron
    electronUser,
    setElectronUser,
    electronAuthChecked,
    setElectronAuthChecked,
    isElectronRuntime,
    
    // UI
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
    
    // Data
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
    
    // Drivers
    connectedDrivers,
    setConnectedDrivers,
    pendingDriverRequests,
    setPendingDriverRequests,
    loadingDrivers,
    setLoadingDrivers,
    
    // Analytics
    todaySales,
    setTodaySales,
    weekSales,
    setWeekSales,
    monthSales,
    setMonthSales,
    topProducts,
    setTopProducts,
    
    // Forms
    productForm,
    setProductForm,
    customerForm,
    setCustomerForm,
    supplierForm,
    setSupplierForm,
    
    // AI Insights
    salesForecast,
    setSalesForecast,
    inventoryRecommendations,
    setInventoryRecommendations,
    productBundles,
    setProductBundles,
    
    // Image Upload
    selectedProductForImage,
    setSelectedProductForImage,
    showImageUploadDialog,
    setShowImageUploadDialog,
    fileInputRef,
    
    // Sale
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
    
    // Admin
    isAdmin,
    setIsAdmin,
    availableVendors,
    setAvailableVendors,
    selectedVendorId,
    setSelectedVendorId,
    isLoadingVendors,
    setIsLoadingVendors,
    
    // Computed
    isArabic,
    translate,
    activeVendorId,
  }
}

