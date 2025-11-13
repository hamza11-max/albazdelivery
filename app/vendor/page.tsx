"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import type { ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { playSuccessSound } from "@/lib/notifications"
import { 
  AlertTriangle,
  BarChart3,
  Camera,
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
  Users
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/Header"

// Hooks
// Use custom hooks
import { useAuth } from "../../hooks/use-auth"
import { useDashboardData } from "./fetch-data"
import { fetchDashboardData, fetchInventory } from "./refresh-data"

// Types
import type {
  InventoryProduct,
  Sale, 
  Customer,
  Supplier,
  Order,
  SaleItem
} from "@/lib/types"

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
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  
  // UI States
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [language, setLanguage] = useState("fr")
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  
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
  
  // Data States
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<InventoryProduct[]>([])
  
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
  // Form States
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    name: "",
    email: "",
    phone: "",
    address: ""
  })

  const [salesForecast, setSalesForecast] = useState<SalesForecast | null>(null)
  const [inventoryRecommendations, setInventoryRecommendations] = useState<InventoryRecommendation[]>([])
  const [productBundles, setProductBundles] = useState<BundleRecommendation[]>([])
  const [selectedProductForImage, setSelectedProductForImage] = useState<number | null>(null)
  const [showCameraDialog, setShowCameraDialog] = useState(false)
  const [posSearch, setPosSearch] = useState("")
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: ""
  })
  
  // POS States
  const [posCart, setPosCart] = useState<CartItem[]>([])
  const [posCustomerId, setPosCustomerId] = useState<number | null>(null)
  const [posDiscount, setPosDiscount] = useState(0)
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)
const [barcodeScannerError, setBarcodeScannerError] = useState<string | null>(null)
const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(false)
const barcodeVideoRef = useRef<HTMLVideoElement | null>(null)
const barcodeStreamRef = useRef<MediaStream | null>(null)
const barcodeAnimationFrameRef = useRef<number>()
const barcodeDetectorRef = useRef<any>(null)
const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
const cameraStreamRef = useRef<MediaStream | null>(null)
const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)
const [capturedImage, setCapturedImage] = useState<string | null>(null)
const [cameraError, setCameraError] = useState<string | null>(null)
const [isCameraActive, setIsCameraActive] = useState(false)
const [isAdmin, setIsAdmin] = useState(false)
const [availableVendors, setAvailableVendors] = useState<Array<{ id: string; name: string }>>([])
const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
const [isLoadingVendors, setIsLoadingVendors] = useState(false)
const isArabic = useMemo(() => language === "ar", [language])
const translate = useCallback(
  (fr: string, ar: string) => (language === "ar" ? ar : fr),
  [language]
)
const activeVendorId = useMemo(
  () => (isAdmin ? selectedVendorId ?? undefined : undefined),
  [isAdmin, selectedVendorId]
)

useEffect(() => {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    setIsBarcodeDetectorSupported(true)
  }
}, [])

const stopBarcodeScanner = useCallback(() => {
  if (barcodeAnimationFrameRef.current) {
    cancelAnimationFrame(barcodeAnimationFrameRef.current)
    barcodeAnimationFrameRef.current = undefined
  }
  if (barcodeStreamRef.current) {
    barcodeStreamRef.current.getTracks().forEach((track) => track.stop())
    barcodeStreamRef.current = null
  }
  if (barcodeVideoRef.current) {
    barcodeVideoRef.current.srcObject = null
  }
}, [])

const startBarcodeScanner = useCallback(async () => {
  setBarcodeScannerError(null)
  if (!isBarcodeDetectorSupported) {
    setBarcodeScannerError(translate("La lecture de code-barres n'est pas prise en charge sur cet appareil.", "مسح الباركود غير مدعوم على هذا الجهاز."))
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    })
    barcodeStreamRef.current = stream
    if (barcodeVideoRef.current) {
      barcodeVideoRef.current.srcObject = stream
      await barcodeVideoRef.current.play()
    }
    const Detector = (window as any).BarcodeDetector
    barcodeDetectorRef.current = new Detector({
      formats: ["code_128", "code_39", "ean_13", "qr_code", "upc_a", "upc_e"],
    })

    const detect = async () => {
      if (!barcodeDetectorRef.current || !barcodeVideoRef.current) {
        barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
        return
      }
      try {
        const codes = await barcodeDetectorRef.current.detect(barcodeVideoRef.current)
        if (codes?.length) {
          const rawValue = codes[0]?.rawValue
          if (rawValue) {
            setPosSearch(rawValue)
            const matchedProduct = products.find((p) => p.barcode === rawValue)
            if (matchedProduct) {
              addToCart(matchedProduct)
              playSuccessSound()
              toast({
                title: translate("Produit trouvé", "تم العثور على المنتج"),
                description: translate("Le produit a été ajouté au panier.", "تمت إضافة المنتج إلى السلة."),
              })
            } else {
              toast({
                title: translate("Code-barres inconnu", "رمز غير معروف"),
                description: translate("Aucun produit ne correspond à ce code-barres.", "لا يوجد منتج مطابق لهذا الرمز."),
                variant: "destructive",
              })
            }
            setIsBarcodeScannerOpen(false)
            return
          }
        }
      } catch (error) {
        console.error("[v0] Barcode detection error:", error)
        setBarcodeScannerError(translate("Impossible de lire le code-barres.", "تعذر قراءة الرمز."))
      }
      barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
    }

    barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
  } catch (error) {
    console.error("[v0] Error starting barcode scanner:", error)
    setBarcodeScannerError(translate("Impossible d'accéder à la caméra.", "تعذر الوصول إلى الكاميرا."))
  }
}, [addToCart, isBarcodeDetectorSupported, products, toast, translate])

useEffect(() => {
  if (!isBarcodeScannerOpen) {
    stopBarcodeScanner()
    return
  }
  startBarcodeScanner()
  return () => {
    stopBarcodeScanner()
  }
}, [isBarcodeScannerOpen, startBarcodeScanner, stopBarcodeScanner])

const stopCamera = useCallback(() => {
  if (cameraStreamRef.current) {
    cameraStreamRef.current.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
  }
  if (cameraVideoRef.current) {
    cameraVideoRef.current.srcObject = null
  }
  setIsCameraActive(false)
}, [])

const startCamera = useCallback(async () => {
  setCameraError(null)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    })
    cameraStreamRef.current = stream
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = stream
      await cameraVideoRef.current.play()
      setIsCameraActive(true)
    }
  } catch (error) {
    console.error("[v0] Error accessing camera:", error)
    setCameraError(translate("Impossible d'accéder à la caméra.", "تعذر الوصول إلى الكاميرا."))
  }
}, [translate])

const capturePhoto = useCallback(() => {
  if (!cameraVideoRef.current) return
  const video = cameraVideoRef.current
  const canvas = captureCanvasRef.current ?? document.createElement("canvas")
  captureCanvasRef.current = canvas
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
  setCapturedImage(dataUrl)
  playSuccessSound()
}, [])

const handleUseCapturedImage = () => {
  if (!capturedImage) return
  setProductForm((prev) => ({
    ...prev,
    image: capturedImage,
  }))
  setShowCameraDialog(false)
  toast({
    title: translate("Image enregistrée", "تم حفظ الصورة"),
    description: translate("La photo du produit a été mise à jour.", "تم تحديث صورة المنتج."),
  })
}

const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith("image/")) {
    toast({
      title: translate("Format non supporté", "تنسيق غير مدعوم"),
      description: translate("Veuillez sélectionner une image valide.", "يرجى اختيار صورة صالحة."),
      variant: "destructive",
    })
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : ""
    setProductForm((prev) => ({
      ...prev,
      image: result,
    }))
    toast({
      title: translate("Image importée", "تم استيراد الصورة"),
      description: translate("La photo du produit a été ajoutée.", "تمت إضافة صورة المنتج."),
    })
  }
  reader.readAsDataURL(file)
}

useEffect(() => {
  if (!showCameraDialog) {
    stopCamera()
    setCapturedImage(null)
    return
  }
  startCamera()
  return () => stopCamera()
}, [showCameraDialog, startCamera, stopCamera])

useEffect(() => {
  return () => {
    stopBarcodeScanner()
    stopCamera()
  }
}, [stopBarcodeScanner, stopCamera])

  // Form reset functions
  const resetProductForm = () => {
    setProductForm({
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
  }

  const resetCustomerForm = () => {
    setCustomerForm({ 
      name: "", 
      email: "", 
      phone: "", 
      address: "" 
    })
  }

  // Data loading function
  const handleDataLoad = useCallback(
    async (vendorContextId?: string) => {
      try {
        const [
          salesRes,
          ordersRes,
          productsRes,
          customersRes,
          suppliersRes,
          categoriesRes
        ] = await Promise.all([
          fetchSales(vendorContextId),
          fetchOrders(vendorContextId),
          fetchProducts(vendorContextId),
          fetchCustomers(vendorContextId),
          fetchSuppliers(vendorContextId),
          fetchCategories(vendorContextId)
        ])

        // Transform responses into proper data types
        const salesData = { sales: salesRes } as SalesData
        const ordersData = { orders: ordersRes } as OrdersData
        const productsData = { products: productsRes } as ProductsData
        const customersData = { customers: customersRes } as CustomersData
        const suppliersData = { suppliers: suppliersRes } as SuppliersData
        const categoriesData = { categories: categoriesRes } as CategoriesData

        // Update state with fetched data
        if (salesData.sales) setSales(salesData.sales)
        if (ordersData.orders) setOrders(ordersData.orders)
        if (productsData.products) {
          setProducts(productsData.products)
          const lowStock = productsData.products.filter(
            (p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)
          )
          setLowStockProducts(lowStock)
        }
        if (customersData.customers) setCustomers(customersData.customers)
        if (suppliersData.suppliers) setSuppliers(suppliersData.suppliers)
        if (categoriesData.categories) setCategories(categoriesData.categories)

        // Calculate sales metrics
        if (salesData.sales?.length) {
          const today = new Date()
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

          // Filter sales by date periods
          const todaySales = salesData.sales.filter((s: Sale) => 
            new Date(s.createdAt).toDateString() === today.toDateString()
          )
          const weekSales = salesData.sales.filter((s: Sale) => 
            new Date(s.createdAt) >= weekAgo
          )
          const monthSales = salesData.sales.filter((s: Sale) => 
            new Date(s.createdAt) >= monthAgo
          )

          // Calculate totals
          setTodaySales(todaySales.reduce((sum: number, s: Sale) => sum + (s.total || 0), 0))
          setWeekSales(weekSales.reduce((sum: number, s: Sale) => sum + (s.total || 0), 0))
          setMonthSales(monthSales.reduce((sum: number, s: Sale) => sum + (s.total || 0), 0))

          // Calculate top products
          if (productsData.products) {
            const productSales = new Map<number, { quantity: number; total: number }>()
            salesData.sales.forEach((sale: Sale) => 
              sale.items.forEach((item: SaleItem) => {
                const existing = productSales.get(item.productId) || { quantity: 0, total: 0 }
                productSales.set(item.productId, {
                  quantity: existing.quantity + item.quantity,
                  total: existing.total + (item.price * item.quantity)
                })
              })
            )

            const topProducts = Array.from(productSales.entries())
              .map(([productId, sales]) => ({
                productId,
                productName: productsData.products.find((p: InventoryProduct) => p.id === productId)?.name || 'Unknown',
                totalQuantity: sales.quantity,
                totalSales: sales.total,
                totalSold: sales.quantity
              }))
              .sort((a, b) => b.totalSales - a.totalSales)
              .slice(0, 5)

            setTopProducts(topProducts)
          }
        }

        // Clear loading states
        setLoadingState(prev => ({
          ...prev,
          products: false,
          categories: false,
          sales: false,
          customers: false,
          suppliers: false,
          orders: false,
          dashboard: false
        }))

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: translate("Erreur", "خطأ"),
          description: translate("Impossible de charger les données du tableau de bord.", "تعذر تحميل بيانات لوحة التحكم."),
          variant: "destructive"
        })
        setLoadingState(prev => ({
          ...prev,
          products: false,
          categories: false,
          sales: false,
          customers: false,
          suppliers: false,
          orders: false,
          dashboard: false
        }))
      }
    },
    [fetchSales, fetchOrders, fetchProducts, fetchCustomers, fetchSuppliers, fetchCategories, setLoadingState, toast]
  )

  // Fetch AI Insights
  const fetchAIInsights = async () => {
    try {
      const response = await fetch(`/api/erp/ai-insights${activeVendorId ? `?vendorId=${activeVendorId}` : ''}`)
      const data = await response.json()
      if (data.success) {
        const d = data.data || {}
        setSalesForecast(d.forecast || null)
        setInventoryRecommendations(Array.isArray(d.recommendations) ? d.recommendations : [])
        setProductBundles(Array.isArray(d.bundles) ? d.bundles : [])
      }
    } catch (error) {
      console.error("[v0] Error fetching AI insights:", error)
    }
  }

  // Save Product
  const saveProduct = async () => {
    try {
      const method = editingProduct ? "PUT" : "POST"
      const inventoryUrl = `/api/erp/inventory${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`
      const response = await fetch(inventoryUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          id: editingProduct?.id,
          costPrice: Number.parseFloat(productForm.costPrice),
          sellingPrice: Number.parseFloat(productForm.sellingPrice),
          stock: productForm.stock,
          lowStockThreshold: productForm.lowStockThreshold,
          vendorId: activeVendorId,
        }),
      })
      const data = await response.json()
      if (data.success) {
        fetchInventory(activeVendorId)
        fetchDashboardData(activeVendorId)
        setShowProductDialog(false)
        setEditingProduct(null)
        setProductForm({
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
        toast({
          title: editingProduct
            ? translate("Produit mis à jour", "تم تحديث المنتج")
            : translate("Produit ajouté", "تمت إضافة المنتج"),
          description: translate("L'inventaire a été mis à jour avec succès", "تم تحديث المخزون بنجاح"),
        })
      }
    } catch (error) {
      console.error("[v0] Error saving product:", error)
    }
  }

  // Delete Product
  const deleteProduct = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) return

    try {
      const url = `/api/erp/inventory?id=${id}${activeVendorId ? `&vendorId=${activeVendorId}` : ""}`
      const response = await fetch(url, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        fetchInventory(activeVendorId)
        toast({
          title: translate("Produit supprimé", "تم حذف المنتج"),
          description: translate("Le produit a été supprimé de l'inventaire", "تم حذف المنتج من المخزون."),
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
    }
  }

  // Add to POS Cart
  const addToCart = (product: InventoryProduct) => {
    const existing = posCart.find((item) => item.id === product.id)
    if (existing) {
      setPosCart(
        posCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setPosCart([
        ...posCart,
        {
          id: product.id,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.sellingPrice || 0,
          discount: 0,
        },
      ])
    }
  }

  // Remove from Cart
  const removeFromCart = (id: number) => {
    setPosCart(posCart.filter((item) => item.id !== id))
  }

  // Update Cart Quantity
  const updateCartQuantity = (productId: number, delta: number) => {
    setPosCart(
      posCart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  // Complete Sale
  const completeSale = async (paymentMethod: "cash" | "card") => {
    if (posCart.length === 0) {
      toast({
        title: translate("Panier vide", "السلة فارغة"),
        description: translate("Ajoutez des produits au panier avant de finaliser la vente", "أضِف منتجات إلى السلة قبل إتمام عملية البيع."),
        variant: "destructive",
      })
      return
    }

    const subtotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal - posDiscount

    try {
      const salesUrl = `/api/erp/sales${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`
      const response = await fetch(salesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: posCustomerId || undefined,
          items: posCart,
          subtotal,
          discount: posDiscount,
          total,
          paymentMethod,
          vendorId: activeVendorId,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setLastSale(data.sale)
        setShowReceiptDialog(true)
        setPosCart([])
        setPosDiscount(0)
        setPosCustomerId(null)
        fetchDashboardData(activeVendorId)
        fetchInventory(activeVendorId)
        fetchSales(activeVendorId)
        toast({
          title: translate("Vente complétée", "تمت العملية"),
          description: isArabic
            ? `تم تسجيل عملية بيع بقيمة ${total.toFixed(2)} ${translate("DZD", "دج")}.`
            : `Vente de ${total.toFixed(2)} ${translate("DZD", "دج")} enregistrée avec succès.`,
        })
      }
    } catch (error) {
      console.error("[v0] Error completing sale:", error)
    }
  }

  // Save Customer
  const saveCustomer = async () => {
    try {
      const response = await fetch(`/api/erp/customers${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      })
      const data = await response.json()
      if (data.success) {
        fetchCustomers(activeVendorId)
        setShowCustomerDialog(false)
        resetCustomerForm()
        toast({
          title: translate("Client ajouté", "تم إضافة العميل"),
          description: translate("Le client a été ajouté avec succès", "تمت إضافة العميل بنجاح."),
        })
      }
    } catch (error) {
      console.error("[v0] Error saving customer:", error)
    }
  }

  // Save Supplier
  const saveSupplier = async () => {
    try {
      const response = await fetch(`/api/erp/suppliers${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...supplierForm,
          vendorId: activeVendorId,
        }),
      })
      const data = await response.json()
      if (data.success) {
        fetchSuppliers(activeVendorId)
        setShowSupplierDialog(false)
        setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
        toast({
          title: translate("Fournisseur ajouté", "تم إضافة المورد"),
          description: translate("Le fournisseur a été ajouté avec succès", "تمت إضافة المورد بنجاح."),
        })
      }
    } catch (error) {
      console.error("[v0] Error saving supplier:", error)
    }
  }

  // Authentication & role handling
  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    const admin = user.role === "ADMIN"
    const vendor = user.role === "VENDOR"

    if (!admin && !vendor) {
      router.push("/login")
      return
    }

    setIsAdmin(admin)
    if (!admin) {
      setSelectedVendorId(null)
    }
  }, [status, isAuthenticated, user, router])

  // Load vendor list for admin users
  useEffect(() => {
    if (!isAdmin) {
      setAvailableVendors([])
      return
    }

    const controller = new AbortController()
    const loadVendors = async () => {
      try {
        setIsLoadingVendors(true)
        const response = await fetch('/api/admin/users?role=VENDOR&status=APPROVED&limit=500', {
          signal: controller.signal,
        })
        const data = await response.json()
        if (data?.success) {
          const vendors = Array.isArray(data.users)
            ? data.users.map((v: any) => ({ id: v.id, name: v.name || v.email || 'Vendor' }))
            : []
          setAvailableVendors(vendors)
          if (vendors.length && !selectedVendorId) {
            setSelectedVendorId(vendors[0].id)
          }
        }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error('[v0] Failed to load vendors:', error)
          toast({
            title: translate("Erreur", "خطأ"),
            description: translate("Impossible de charger la liste des vendeurs.", "تعذر تحميل قائمة التجار."),
            variant: "destructive",
          })
        }
      } finally {
        setIsLoadingVendors(false)
      }
    }

    loadVendors()

    return () => controller.abort()
  }, [isAdmin, selectedVendorId, toast, translate])

  // Load data when context changes
  useEffect(() => {
    if (status === "loading" || !isAuthenticated) return
    if (isAdmin && !selectedVendorId) return
    const vendorContextId = isAdmin ? selectedVendorId ?? undefined : undefined
    handleDataLoad(vendorContextId)
  }, [status, isAuthenticated, isAdmin, selectedVendorId, handleDataLoad])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const cartSubtotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartTotal = cartSubtotal - posDiscount

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header */}
      <Header 
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6" dir={isArabic ? "rtl" : "ltr"}>
        {isAdmin && (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {translate("Mode administrateur", "وضع المسؤول")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {translate(
                  "Sélectionnez un vendeur pour consulter et gérer ses données.",
                  "اختر تاجراً لعرض بياناته وإدارتها."
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                {translate("Vendeur", "التاجر")}
              </Label>
              <select
                className="h-10 rounded-md border px-3 text-sm bg-background"
                value={selectedVendorId ?? ""}
                onChange={(event) => setSelectedVendorId(event.target.value || null)}
                disabled={isLoadingVendors || availableVendors.length === 0}
              >
                {availableVendors.length === 0 && (
                  <option value="">
                    {isLoadingVendors
                      ? translate("Chargement...", "جار التحميل...")
                      : translate("Aucun vendeur disponible", "لا يوجد تجار متاحون")}
                  </option>
                )}
                {availableVendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              {translate("Tableau de bord", "لوحة التحكم")}
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              {translate("Inventaire", "المخزون")}
            </TabsTrigger>
            <TabsTrigger value="pos">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {translate("Point de Vente", "نقطة البيع")}
            </TabsTrigger>
            <TabsTrigger value="sales">
              <History className="w-4 h-4 mr-2" />
              {translate("Ventes", "المبيعات")}
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="w-4 h-4 mr-2" />
              {translate("Clients", "العملاء")}
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Truck className="w-4 h-4 mr-2" />
              {translate("Fournisseurs", "الموردون")}
            </TabsTrigger>
            <TabsTrigger value="ai">
              <BarChart3 className="w-4 h-4 mr-2" />
              {translate("Analyse IA", "تحليلات الذكاء الاصطناعي")}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translate("Ventes d'aujourd'hui", "مبيعات اليوم")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">
                      {todaySales.toFixed(2)} {translate("DZD", "دج")}
                    </p>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translate("Ventes cette semaine", "مبيعات هذا الأسبوع")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">
                      {weekSales.toFixed(2)} {translate("DZD", "دج")}
                    </p>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translate("Ventes ce mois", "مبيعات هذا الشهر")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">
                      {monthSales.toFixed(2)} {translate("DZD", "دج")}
                    </p>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Products & Low Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{translate("Produits les plus vendus", "المنتجات الأكثر مبيعاً")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.totalQuantity} {translate("vendus", "تم بيعها")}
                            </p>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                    {topProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {translate("Aucune vente enregistrée", "لا توجد مبيعات مسجلة")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    {translate("Alertes stock faible", "تنبيهات انخفاض المخزون")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {translate("Référence", "المرجع")}: {product.sku}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {product.stock} {translate("restants", "متبقي")}
                        </Badge>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {translate("Tous les stocks sont suffisants", "جميع المخزونات كافية")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{translate("Actions rapides", "إجراءات سريعة")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => setActiveTab("pos")} className="h-20 flex-col gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    {translate("Nouvelle vente", "عملية بيع جديدة")}
                  </Button>
                  <Button onClick={() => setShowProductDialog(true)} variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="w-6 h-6" />
                    {translate("Ajouter un produit", "إضافة منتج")}
                  </Button>
                  <Button onClick={() => setActiveTab("inventory")} variant="outline" className="h-20 flex-col gap-2">
                    <Package className="w-6 h-6" />
                    {translate("Voir l'inventaire", "عرض المخزون")}
                  </Button>
                  <Button onClick={() => setActiveTab("sales")} variant="outline" className="h-20 flex-col gap-2">
                    <History className="w-6 h-6" />
                    {translate("Historique", "السجل")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {translate("Gestion de l'inventaire", "إدارة المخزون")}
              </h2>
              <Button onClick={() => setShowProductDialog(true)}>
                <Plus className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                {translate("Ajouter un produit", "إضافة منتج")}
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Prix Coût</TableHead>
                      <TableHead>Prix Vente</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.costPrice} DZD</TableCell>
                        <TableCell className="font-semibold">{product.sellingPrice} DZD</TableCell>
                        <TableCell>
                          <Badge variant={product.stock <= product.lowStockThreshold ? "destructive" : "default"}>
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingProduct(product)
                                setProductForm({
                                  sku: product.sku,
                                  name: product.name,
                                  category: product.category,
                                  description: product.description || "",
                                  supplierId: product.supplierId?.toString() || "",
                                  costPrice: product.costPrice.toString(),
                                  sellingPrice: product.sellingPrice.toString(),
                                  price: product.price.toString(),
                                  stock: product.stock,
                                  lowStockThreshold: product.lowStockThreshold,
                                  barcode: product.barcode || "",
                                  image: product.image || ""
                                })
                                setShowProductDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProductForImage(product.id)
                                setShowCameraDialog(true)
                              }}
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => deleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {products.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">
                      {translate("Aucun produit dans l'inventaire", "لا توجد منتجات في المخزون")}
                    </p>
                    <Button onClick={() => setShowProductDialog(true)}>
                      <Plus className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                      {translate("Ajouter votre premier produit", "أضف أول منتج لك")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* POS Tab */}
          <TabsContent value="pos" className="space-y-6">
            <h2 className="text-2xl font-bold">Point de Vente</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Selection */}
              <div className="lg:col-span-2 space-y-4">
                <div className={`flex ${isArabic ? "flex-row-reverse" : "flex-row"} items-center gap-2`}>
                  <div className="relative flex-1">
                    <Search
                      className={`absolute ${isArabic ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5`}
                    />
                    <Input
                      placeholder={translate(
                        "Rechercher un produit ou scanner un code-barres...",
                        "ابحث عن منتج أو امسح رمزاً شريطياً..."
                      )}
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      className={`${isArabic ? "pr-10 text-right" : "pl-10"}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setIsBarcodeScannerOpen(true)}
                    disabled={!isBarcodeDetectorSupported}
                  >
                    <ScanLine className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                    {translate("Scanner", "مسح")}
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products
                    .filter(
                      (p) =>
                        p.stock > 0 &&
                        (p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(posSearch.toLowerCase()) ||
                          p.barcode?.includes(posSearch)),
                    )
                    .map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-primary">{product.sellingPrice} DZD</p>
                            <Badge variant="secondary">{product.stock}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Cart */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Panier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {posCart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.price} DZD</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateCartQuantity(item.productId, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateCartQuantity(item.productId, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {posCart.length === 0 && (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Panier vide</p>
                      </div>
                    )}

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sous-total:</span>
                        <span className="font-semibold">{cartSubtotal.toFixed(2)} DZD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Remise:</Label>
                        <Input
                          type="number"
                          value={posDiscount}
                          onChange={(e) => setPosDiscount(Number.parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                        <span className="text-sm">DZD</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-primary">{cartTotal.toFixed(2)} DZD</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => completeSale("cash")} disabled={posCart.length === 0}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payer en Espèces
                      </Button>
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                        onClick={() => completeSale("card")}
                        disabled={posCart.length === 0}
                      >
                        Payer par Carte
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Sales History Tab */}
          <TabsContent value="sales" className="space-y-6">
            <h2 className="text-2xl font-bold">Historique des Ventes</h2>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Articles</TableHead>
                      <TableHead>Sous-total</TableHead>
                      <TableHead>Remise</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.id.slice(0, 8)}</TableCell>
                        <TableCell>{new Date(sale.createdAt).toLocaleString("fr-FR")}</TableCell>
                        <TableCell>{sale.items.length}</TableCell>
                        <TableCell>{sale.subtotal.toFixed(2)} DZD</TableCell>
                        <TableCell>{sale.discount.toFixed(2)} DZD</TableCell>
                        <TableCell className="font-bold">{sale.total.toFixed(2)} DZD</TableCell>
                        <TableCell>
                          <Badge variant={sale.paymentMethod === "cash" ? "default" : "secondary"}>
                            {sale.paymentMethod === "cash" ? "Espèces" : "Carte"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sales.length === 0 && (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">Aucune vente enregistrée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestion des Clients</h2>
              <Button onClick={() => setShowCustomerDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Client
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <Badge>{customer.totalPurchases.toFixed(2)} DZD</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{customer.phone}</p>
                      {customer.email && <p>{customer.email}</p>}
                      {customer.lastPurchaseDate && (
                        <p className="text-xs">
                          Dernier achat: {new Date(customer.lastPurchaseDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {customers.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground mb-4">Aucun client enregistré</p>
                  <Button onClick={() => setShowCustomerDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter votre premier client
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestion des Fournisseurs</h2>
              <Button onClick={() => setShowSupplierDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Fournisseur
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">Contact: {supplier.contactPerson}</p>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Tél:</span>
                            <span>{supplier.phone}</span>
                          </p>
                          {supplier.email && (
                            <p className="flex items-center gap-2">
                              <span className="text-muted-foreground">Email:</span>
                              <span>{supplier.email}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {suppliers.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground mb-4">Aucun fournisseur enregistré</p>
                  <Button onClick={() => setShowSupplierDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter votre premier fournisseur
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai" className="space-y-6">
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
        </Tabs>
      </main>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Modifier le Produit" : "Ajouter un Produit"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nom du Produit</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Code-barres</Label>
              <Input
                value={productForm.barcode}
                onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prix Coût (DZD)</Label>
              <Input
                type="number"
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prix Vente (DZD)</Label>
              <Input
                type="number"
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stock Initial</Label>
              <Input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Seuil Stock Faible</Label>
              <Input
                type="number"
                value={productForm.lowStockThreshold}
                onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Photo du Produit (URL)</Label>
              <Input
                type="url"
                placeholder="https://exemple.com/produit.jpg ou /placeholder.jpg"
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Fournissez une URL de l'image du produit. Cette photo sera visible dans l'inventaire et pour les clients.
              </p>
              {productForm.image && (
                <div className="mt-2">
                  <img
                    src={productForm.image}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveProduct}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optionnel)</Label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveCustomer}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Fournisseur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'Entreprise</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Personne de Contact</Label>
              <Input
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optionnel)</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse (optionnel)</Label>
              <Textarea
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveSupplier}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reçu de Vente</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <p className="font-bold text-lg">ERP - Gestion de Boutique</p>
                <p className="text-sm text-muted-foreground">Reçu #{lastSale.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{new Date(lastSale.createdAt).toLocaleString("fr-FR")}</p>
              </div>
              <div className="space-y-2">
                {lastSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>{(item.price * item.quantity).toFixed(2)} DZD</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span>{lastSale.subtotal.toFixed(2)} DZD</span>
                </div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise:</span>
                    <span>-{lastSale.discount.toFixed(2)} DZD</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{lastSale.total.toFixed(2)} DZD</span>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Paiement: {lastSale.paymentMethod === "cash" ? "Espèces" : "Carte"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Fermer
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Capture Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capturez une image du produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Appuyez sur le bouton ci-dessous pour capturer une image
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setShowCameraDialog(false)} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Capturer l'image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
