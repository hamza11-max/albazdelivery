"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { playSuccessSound } from "@/lib/notifications"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  Users,
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Minus,
  BarChart3,
  DollarSign,
  ShoppingBag,
  Receipt,
  Printer,
} from "lucide-react"
import type { InventoryProduct, Customer, Supplier, Sale, SaleItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

// Import Header component
import Header from "@/components/Header"

export default function VendorERPApp() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === "authenticated"
  const [language, setLanguage] = useState("fr")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { toast } = useToast()

  // Dashboard State
  const [todaySales, setTodaySales] = useState(0)
  const [weekSales, setWeekSales] = useState(0)
  const [monthSales, setMonthSales] = useState(0)
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<InventoryProduct[]>([])

  // Inventory State
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null)
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    supplierId: "",
    costPrice: "",
    sellingPrice: "",
    stock: "",
    lowStockThreshold: "",
    barcode: "",
    image: "",
  })
  const [productImages, setProductImages] = useState<{ [key: number]: string }>({})
  const [showCameraDialog, setShowCameraDialog] = useState(false)
  const [selectedProductForImage, setSelectedProductForImage] = useState<number | null>(null)

  // POS State
  const [posCart, setPosCart] = useState<SaleItem[]>([])
  const [posSearch, setPosSearch] = useState("")
  const [posDiscount, setPosDiscount] = useState(0)
  const [posCustomerId, setPosCustomerId] = useState("")
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Sales History State
  const [sales, setSales] = useState<Sale[]>([])
  const [salesFilter, setSalesFilter] = useState({
    startDate: "",
    endDate: "",
    customerId: "",
    paymentMethod: "",
  })

  // CRM State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Supplier State
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  })

  // AI Insights State
  const [salesForecast, setSalesForecast] = useState<any>(null)
  const [inventoryRecommendations, setInventoryRecommendations] = useState<any[]>([])
  const [productBundles, setProductBundles] = useState<any[]>([])

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/erp/dashboard")
      const data = await response.json()
      if (data.success) {
        const d = data.data || {}
        setTodaySales(d.todaySales || 0)
        setWeekSales(d.weekSales || 0)
        setMonthSales(d.monthSales || 0)
        setTopProducts(Array.isArray(d.topProducts) ? d.topProducts : [])
        setLowStockProducts(Array.isArray(d.lowStockProducts) ? d.lowStockProducts : [])
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard:", error)
    }
  }

  // Fetch Inventory
  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/erp/inventory")
      const data = await response.json()
      if (data.success) {
        const d = data.data || {}
        setProducts(Array.isArray(d.products) ? d.products : [])
      }
    } catch (error) {
      console.error("[v0] Error fetching inventory:", error)
    }
  }

  // Fetch Sales
  const fetchSales = async () => {
    try {
      const response = await fetch("/api/erp/sales")
      const data = await response.json()
      if (data.success) {
        const d = data.data || {}
        const sales = Array.isArray(d.sales) ? d.sales : []
        // normalize paymentMethod for UI
        const norm = sales.map((s: any) => ({
          ...s,
          paymentMethod: (s.paymentMethod || 'cash').toString().toLowerCase(),
        }))
        setSales(norm)
      }
    } catch (error) {
      console.error("[v0] Error fetching sales:", error)
    }
  }

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/erp/customers")
      const data = await response.json()
      if (data.success) {
        const d = data.data || {}
        setCustomers(Array.isArray(d.customers) ? d.customers : [])
      }
    } catch (error) {
      console.error("[v0] Error fetching customers:", error)
    }
  }

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/erp/suppliers")
      const data = await response.json()
      if (data.success) {
        const d = data.data || {}
        setSuppliers(Array.isArray(d.suppliers) ? d.suppliers : [])
      }
    } catch (error) {
      console.error("[v0] Error fetching suppliers:", error)
    }
  }

  // Fetch AI Insights
  const fetchAIInsights = async () => {
    try {
      const response = await fetch("/api/erp/ai-insights")
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
      const response = await fetch("/api/erp/inventory", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          id: editingProduct?.id,
          costPrice: Number.parseFloat(productForm.costPrice),
          sellingPrice: Number.parseFloat(productForm.sellingPrice),
          stock: Number.parseInt(productForm.stock),
          lowStockThreshold: Number.parseInt(productForm.lowStockThreshold),
        }),
      })
      const data = await response.json()
      if (data.success) {
        fetchInventory()
        fetchDashboardData()
        setShowProductDialog(false)
        setEditingProduct(null)
        setProductForm({
          sku: "",
          name: "",
          category: "",
          supplierId: "",
          costPrice: "",
          sellingPrice: "",
          stock: "",
          lowStockThreshold: "",
          barcode: "",
          image: "",
        })
        toast({
          title: editingProduct ? "Produit mis à jour" : "Produit ajouté",
          description: "L'inventaire a été mis à jour avec succès",
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
      const response = await fetch(`/api/erp/inventory?id=${id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        fetchInventory()
        toast({
          title: "Produit supprimé",
          description: "Le produit a été supprimé de l'inventaire",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
    }
  }

  // Add to POS Cart
  const addToCart = (product: InventoryProduct) => {
    const existing = posCart.find((item) => item.productId === product.id)
    if (existing) {
      setPosCart(
        posCart.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setPosCart([
        ...posCart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.sellingPrice,
          discount: 0,
        },
      ])
    }
  }

  // Remove from Cart
  const removeFromCart = (productId: number) => {
    setPosCart(posCart.filter((item) => item.productId !== productId))
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
        title: "Panier vide",
        description: "Ajoutez des produits au panier avant de finaliser la vente",
        variant: "destructive",
      })
      return
    }

    const subtotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal - posDiscount

    try {
      const response = await fetch("/api/erp/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: posCustomerId || undefined,
          items: posCart,
          subtotal,
          discount: posDiscount,
          total,
          paymentMethod,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setLastSale(data.sale)
        setShowReceiptDialog(true)
        setPosCart([])
        setPosDiscount(0)
        setPosCustomerId("")
        fetchDashboardData()
        fetchInventory()
        fetchSales()
        toast({
          title: "Vente complétée",
          description: `Vente de ${total} DZD enregistrée avec succès`,
        })
      }
    } catch (error) {
      console.error("[v0] Error completing sale:", error)
    }
  }

  // Save Customer
  const saveCustomer = async () => {
    try {
      const response = await fetch("/api/erp/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      })
      const data = await response.json()
      if (data.success) {
        fetchCustomers()
        setShowCustomerDialog(false)
        setCustomerForm({ name: "", email: "", phone: "" })
        toast({
          title: "Client ajouté",
          description: "Le client a été ajouté avec succès",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving customer:", error)
    }
  }

  // Save Supplier
  const saveSupplier = async () => {
    try {
      const response = await fetch("/api/erp/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      })
      const data = await response.json()
      if (data.success) {
        fetchSuppliers()
        setShowSupplierDialog(false)
        setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
        toast({
          title: "Fournisseur ajouté",
          description: "Le fournisseur a été ajouté avec succès",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving supplier:", error)
    }
  }

  const handleImageCapture = (productId: number, imageData: string) => {
    setProductImages({ ...productImages, [productId]: imageData })
    playSuccessSound()
    toast({
      title: "Image capturée",
      description: "L'image du produit a été enregistrée avec succès",
    })
  }

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || user?.role !== "VENDOR") {
      router.push("/login")
      return
    }

    fetchDashboardData()
    fetchInventory()
    fetchSales()
    fetchCustomers()
    fetchSuppliers()
    fetchAIInsights()
  }, [status, isAuthenticated, user, router])

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventaire
            </TabsTrigger>
            <TabsTrigger value="pos">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Point de Vente
            </TabsTrigger>
            <TabsTrigger value="sales">
              <History className="w-4 h-4 mr-2" />
              Ventes
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Truck className="w-4 h-4 mr-2" />
              Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="ai">
              <BarChart3 className="w-4 h-4 mr-2" />
              IA Insights
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventes Aujourd'hui</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">{todaySales.toFixed(2)} DZD</p>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventes Cette Semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">{weekSales.toFixed(2)} DZD</p>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventes Ce Mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">{monthSales.toFixed(2)} DZD</p>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Products & Low Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produits les Plus Vendus</CardTitle>
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
                            <p className="text-sm text-muted-foreground">{product.totalSold} vendus</p>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                    {topProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Alertes Stock Faible
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <Badge variant="destructive">{product.stock} restants</Badge>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Tous les stocks sont suffisants</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => setActiveTab("pos")} className="h-20 flex-col gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Nouvelle Vente
                  </Button>
                  <Button onClick={() => setShowProductDialog(true)} variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="w-6 h-6" />
                    Ajouter Produit
                  </Button>
                  <Button onClick={() => setActiveTab("inventory")} variant="outline" className="h-20 flex-col gap-2">
                    <Package className="w-6 h-6" />
                    Voir Inventaire
                  </Button>
                  <Button onClick={() => setActiveTab("sales")} variant="outline" className="h-20 flex-col gap-2">
                    <History className="w-6 h-6" />
                    Historique
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestion de l'Inventaire</h2>
              <Button onClick={() => setShowProductDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Produit
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
                                  supplierId: product.supplierId?.toString() || "",
                                  costPrice: product.costPrice.toString(),
                                  sellingPrice: product.sellingPrice.toString(),
                                  stock: product.stock.toString(),
                                  lowStockThreshold: product.lowStockThreshold.toString(),
                                  barcode: product.barcode || "",
                                  image: product.image || "",
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
                    <p className="text-lg text-muted-foreground mb-4">Aucun produit dans l'inventaire</p>
                    <Button onClick={() => setShowProductDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter votre premier produit
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Rechercher un produit ou scanner un code-barres..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    className="pl-10"
                  />
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
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Seuil Stock Faible</Label>
              <Input
                type="number"
                value={productForm.lowStockThreshold}
                onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
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
