"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useSSE } from "@/lib/use-sse"
import type { Order } from "@/lib/types"
import {
  ShoppingCart,
  User,
  Star,
  Plus,
  Minus,
  Trash2,
  Package,
  Truck,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingBag,
  Home,
  ChevronRight,
  ArrowLeft,
  Share2,
  Globe,
  HelpCircle,
  LogOut,
  Bell,
  MapPin,
  Search,
  Clock,
  Gift,
  Moon,
  Sun,
  Store,
  Pill,
  Pizza,
  Bike,
} from "lucide-react"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

const categories = [
  {
    id: 1,
    name: "Shops",
    nameAr: "متاجر",
    nameFr: "Boutiques",
    icon: Store,
    color: "bg-gradient-to-br from-emerald-100 to-green-50",
    iconColor: "text-emerald-600",
  },
  {
    id: 2,
    name: "Pharmacy & Beauty",
    nameAr: "صيدلية وتجميل",
    nameFr: "Pharmacie & Beauté",
    icon: Pill,
    color: "bg-gradient-to-br from-pink-100 to-rose-50",
    iconColor: "text-pink-500",
  },
  {
    id: 3,
    name: "Groceries",
    nameAr: "بقالة",
    nameFr: "Épicerie",
    icon: ShoppingCart,
    color: "bg-gradient-to-br from-orange-100 to-amber-50",
    iconColor: "text-orange-500",
  },
  {
    id: 4,
    name: "Food",
    nameAr: "طعام",
    nameFr: "Nourriture",
    icon: Pizza,
    color: "bg-gradient-to-br from-orange-100 to-yellow-50",
    iconColor: "text-orange-600",
  },
  {
    id: 5,
    name: "Package Delivery",
    nameAr: "توصيل الطرود",
    nameFr: "Livraison de colis",
    icon: Bike,
    color: "bg-gradient-to-br from-yellow-100 to-amber-50",
    iconColor: "text-yellow-600",
  },
]

// Mock data for stores
const stores = [
  { id: 1, name: "Le Taj Mahal", type: "Cuisine Indienne", rating: 4.5, deliveryTime: "30-45 min", categoryId: 1 },
  { id: 2, name: "Supermarché Numidis", type: "Supermarché", rating: 4.7, deliveryTime: "20-30 min", categoryId: 2 },
  { id: 3, name: "Pharmacie El Hakim", type: "Pharmacie", rating: 4.8, deliveryTime: "15-25 min", categoryId: 3 },
  { id: 4, name: "Pizza Napoli", type: "Pizzeria", rating: 4.6, deliveryTime: "25-35 min", categoryId: 1 },
  { id: 5, name: "Express Colis", type: "Livraison", rating: 4.9, deliveryTime: "Même jour", categoryId: 4 },
  {
    id: 6,
    name: "Boutique Souvenirs",
    type: "Cadeaux & Artisanat",
    rating: 4.4,
    deliveryTime: "40-50 min",
    categoryId: 5,
  },
]

// Mock data for products
const products = [
  {
    id: 1,
    storeId: 1,
    name: "Poulet Tikka Masala",
    description: "Poulet mariné dans une sauce crémeuse aux épices",
    price: 1200,
    image: "/chicken-tikka-masala.png",
    rating: 4.5,
  },
  {
    id: 2,
    storeId: 1,
    name: "Biryani aux Légumes",
    description: "Riz basmati parfumé avec légumes et épices",
    price: 900,
    image: "/vegetable-biryani.png",
    rating: 4.7,
  },
  {
    id: 3,
    storeId: 1,
    name: "Naan au Fromage",
    description: "Pain indien traditionnel garni de fromage",
    price: 350,
    image: "/cheese-naan-bread.jpg",
    rating: 4.8,
  },
  {
    id: 4,
    storeId: 2,
    name: "Lait Candia 1L",
    description: "Lait demi-écrémé UHT",
    price: 120,
    image: "/milk-carton.png",
    rating: 4.6,
  },
  {
    id: 5,
    storeId: 2,
    name: "Pain Complet",
    description: "Pain frais du jour",
    price: 80,
    image: "/whole-wheat-bread.png",
    rating: 4.9,
  },
  {
    id: 6,
    storeId: 2,
    name: "Huile d'Olive 1L",
    description: "Huile d'olive extra vierge",
    price: 650,
    image: "/olive-oil-bottle.png",
    rating: 4.4,
  },
  {
    id: 7,
    storeId: 4,
    name: "Pizza Margherita",
    description: "Tomate, mozzarella, basilic frais",
    price: 1100,
    image: "/margherita-pizza.png",
    rating: 4.8,
  },
  {
    id: 8,
    storeId: 4,
    name: "Pizza 4 Fromages",
    description: "Mozzarella, gorgonzola, parmesan, chèvre",
    price: 1300,
    image: "/four-cheese-pizza.png",
    rating: 4.6,
  },
  {
    id: 9,
    storeId: 4,
    name: "Pizza Végétarienne",
    description: "Légumes grillés, olives, champignons",
    price: 1200,
    image: "/vegetarian-pizza.jpg",
    rating: 4.7,
  },
]

// Algerian cities
const cities = ["Alger", "Ouargla", "Ghardaïa", "Tamanrasset"]

export default function AlBazApp() {
  const router = useRouter()
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Safely handle useSession during build time
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"
  const user = session?.user ?? null
  const isAuthenticated = status === "authenticated"
  
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentPage, setCurrentPage] = useState("home")
  const [selectedCity] = useState("Tamanrasset")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [cart, setCart] = useState<Array<{ productId: number; quantity: number }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [selectedLanguage, setSelectedLanguage] = useState("fr")
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  // New state for customer ID and current order
  const customerId = user?.id || "customer-1"
  const shouldUseSSE = currentPage === "tracking" && !!orderId
  const { data: sseData } = useSSE(`/api/notifications/sse?role=customer&userId=${customerId}`, shouldUseSSE)

  // Add timeout for loading state to prevent infinite loading
  // But only if we're not coming from a login (give more time after login)
  useEffect(() => {
    if (status === "loading") {
      // Check if we have a session cookie (might be setting up after login)
      const hasSessionCookie = typeof document !== 'undefined' && (
        document.cookie.includes('next-auth.session-token') || 
        document.cookie.includes('__Secure-next-auth.session-token')
      )
      
      // Check if we're on the login page (don't redirect if already there)
      const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'
      
      // Give more time if we have a cookie (likely just logged in)
      // Don't redirect if already on login page
      const timeoutDuration = hasSessionCookie ? 20000 : 10000 // Increased timeouts
      
      const timeout = setTimeout(() => {
        // Only redirect if still loading, no cookie found, and not already on login page
        // Also check that we're not in the middle of a navigation
        if (status === "loading" && !hasSessionCookie && !isOnLoginPage && typeof window !== 'undefined') {
          // Double-check we're still on the same page before redirecting
          if (window.location.pathname !== '/login') {
            // Only log warning in development, suppress in production to reduce noise
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Auth] Session loading timeout - redirecting to login')
            }
            router.push("/login")
          }
        }
      }, timeoutDuration)
      return () => clearTimeout(timeout)
    }
  }, [status, router])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (sseData?.type === "order_updated" && sseData.order?.id === orderId) {
      setCurrentOrder(sseData.order)
      console.log("[v0] Order updated via SSE:", sseData.order)
    }
  }, [sseData, orderId])

  // Fetch order details initially and periodically
  useEffect(() => {
    if (orderId && currentPage === "tracking") {
      const fetchOrder = async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`)
          const data = await response.json()
          if (data.success) {
            setCurrentOrder(data.order)
          }
        } catch (error) {
          console.error("[v0] Error fetching order:", error)
        }
      }
      fetchOrder()
      const interval = setInterval(fetchOrder, 5000)
      return () => clearInterval(interval)
    }
  }, [orderId, currentPage])

  useEffect(() => {
    if (status === "loading") return

    console.log('[Root Page] Auth status:', { status, user: user?.email, role: user?.role })

    if (status === "unauthenticated") {
      console.log('[Root Page] Unauthenticated - redirecting to login')
      router.push("/login")
      return
    }

    if (status === "authenticated" && user?.role) {
      console.log('[Root Page] Authenticated - role:', user.role)
      if (user.role !== "CUSTOMER") {
        const dest = user.role === "ADMIN" ? "/admin" : user.role === "VENDOR" ? "/vendor" : user.role === "DRIVER" ? "/driver" : "/"
        console.log('[Root Page] Redirecting to:', dest)
        router.push(dest)
      }
      // If CUSTOMER, stay on this page (home page)
    }
  }, [status, user, router])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Apply RTL/LTR and lang attribute based on selected language
  useEffect(() => {
    document.documentElement.lang = selectedLanguage
    document.documentElement.dir = selectedLanguage === "ar" ? "rtl" : "ltr"
  }, [selectedLanguage])

  // Show loading or nothing while checking authentication
  // IMPORTANT: All hooks must be called before conditional returns
  // Add a timeout to prevent infinite loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
          <p className="mt-2 text-xs text-gray-400">Si cette page ne se charge pas, <a href="/login" className="text-teal-600 underline">cliquez ici</a></p>
        </div>
      </div>
    )
  }

  // Don't render the app if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null
  }

  const t = (key: string, fr: string, ar: string) => {
    if (selectedLanguage === "ar") return ar
    return fr
  }

  // Cart functions
  const addToCart = (productId: number) => {
    const existingItem = cart.find((item) => item.productId === productId)
    if (existingItem) {
      setCart(cart.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { productId, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      return total + (product?.price || 0) * item.quantity
    }, 0)
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Updated placeOrder function to handle API calls
  const placeOrder = async () => {
    if (cart.length === 0) return

    const subtotal = getCartTotal()
    const deliveryFee = 500
    const total = subtotal + deliveryFee

    // Determine storeId from the first item in the cart
    const firstItem = cart[0]
    const product = products.find((p) => p.id === firstItem.productId)
    const storeId = product?.storeId || 1

    const orderData = {
      customerId,
      storeId,
      items: cart.map((item) => {
        const prod = products.find((p) => p.id === item.productId)
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: prod?.price || 0,
        }
      }),
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      deliveryAddress: "123 Rue Example, Appartement 4", // Placeholder address
      city: selectedCity,
      customerPhone: "+213555000000", // Placeholder phone number
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        setOrderId(data.order.id)
        setCurrentOrder(data.order)
        setCurrentPage("tracking")
        setCart([])
        console.log("[v0] Order placed successfully:", data.order.id)
      } else {
        console.error("[v0] Failed to place order:", data.error)
        alert(
          t("order-error", "Erreur lors de la commande. Veuillez réessayer.", "خطأ في الطلب. يرجى المحاولة مرة أخرى."),
        )
      }
    } catch (error) {
      console.error("[v0] Error placing order:", error)
      alert(
        t("order-error", "Erreur lors de la commande. Veuillez réessayer.", "خطأ في الطلب. يرجى المحاولة مرة أخرى."),
      )
    }
  }

  // Filter stores by category and search
  const filteredStores = stores.filter((store) => {
    const matchesCategory = selectedCategory ? store.categoryId === selectedCategory : true
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const Header = () => (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setCurrentPage("home")
              setSelectedCategory(null)
              setSelectedStore(null)
            }}
            className="flex items-center gap-2"
          >
            <img src="/logo.png" alt="ALBAZ FAST DELIVERY" className="h-[84px] w-auto" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2 max-w-xs">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedCity}</span>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  )

  const HomePage = () => (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Bar */}
      <div className="px-4 py-4 bg-background sticky top-[57px] z-40 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("search", "Découvrir...", "اكتشف...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-none rounded-lg h-11"
          />
        </div>
      </div>

      {/* Circular Category Icons */}
      <div className="px-4 py-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
          {categories.map((category) => {
            const categoryName = selectedLanguage === "ar" ? category.nameAr : category.nameFr
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => {
                  if (category.id === 5) {
                    router.push("/package-delivery")
                  } else {
                    setSelectedCategory(category.id)
                    setCurrentPage("category")
                  }
                }}
                className="flex flex-col items-center gap-3 group"
              >
                <div
                  className={`w-24 h-24 rounded-full ${category.color} dark:bg-gray-700 flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-all duration-300`}
                >
                  <Icon className={`w-12 h-12 ${category.iconColor} dark:text-gray-200 stroke-[2.5]`} />
                </div>
                <span className="text-sm font-semibold text-center text-gray-800 dark:text-gray-200 max-w-[90px]">
                  {categoryName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Ads Section */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold mb-4 text-foreground">{t("promotions", "Promotions", "العروض الترويجية")}</h2>
        <div className="space-y-4">
          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border">
            <div className="relative h-40 bg-gradient-to-r from-primary to-orange-500">
              <img
                src="/placeholder.jpg"
                alt="Promotion"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">{t("promo-title", "Livraison Gratuite", "توصيل مجاني")}</h3>
                  <p className="text-sm">{t("promo-desc", "Sur votre première commande", "على طلبك الأول")}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border">
            <div className="relative h-40 bg-gradient-to-r from-green-400 to-emerald-500">
              <img
                src="/placeholder.jpg"
                alt="Promotion"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">{t("discount", "-20% Réduction", "خصم 20%-")}</h3>
                  <p className="text-sm">
                    {t("grocery-promo", "Sur tous les produits d'épicerie", "على جميع منتجات البقالة")}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  const MyOrdersView = () => {
    const [packageDeliveries, setPackageDeliveries] = useState<Order[]>([])
    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [activeTab, setActiveTab] = useState<"orders" | "packages" | "track">("orders")

    useEffect(() => {
      const fetchOrders = async () => {
        setLoadingOrders(true)
        try {
          const response = await fetch(`/api/orders?customerId=${customerId}`)
          const data = await response.json()
          if (data.success) {
            const orders = data.orders || []
            setAllOrders(orders.filter((o: Order) => !o.isPackageDelivery))
            setPackageDeliveries(orders.filter((o: Order) => o.isPackageDelivery))
          }
        } catch (error) {
          console.error("[v0] Error fetching orders:", error)
        } finally {
          setLoadingOrders(false)
        }
      }

      fetchOrders()
    }, [customerId])

    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-[57px] z-40 bg-background border-b border-border px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")} className="hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">{t("my-orders", "Mes Commandes", "طلباتي")}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[105px] z-30 bg-background border-b border-border px-4 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === "orders"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("orders", "Commandes", "الطلبات")}
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === "packages"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("my-packages", "Mes Colis", "حزمي")}
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === "track"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("track-order", "Suivre Commande", "تتبع الطلب")}
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <h2 className="text-lg font-bold mb-4 text-foreground">{t("orders", "Commandes", "الطلبات")}</h2>
              {allOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">{t("no-orders", "Aucune commande", "لا توجد طلبات")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {allOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="border-border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setOrderId(order.id)
                        setCurrentOrder(order)
                        setCurrentPage("tracking")
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                className={
                                  order.status === "DELIVERED"
                                    ? "bg-green-500"
                                    : order.status === "IN_DELIVERY"
                                      ? "bg-blue-500"
                                      : "bg-yellow-500"
                                }
                              >
                                {order.status === "DELIVERED"
                                  ? t("delivered", "Livrée", "تم التوصيل")
                                  : order.status === "IN_DELIVERY"
                                    ? t("in-delivery", "En Livraison", "قيد التوصيل")
                                    : t("pending", "En Attente", "قيد الانتظار")}
                              </Badge>
                              <span className="text-sm font-mono text-muted-foreground">#{order.id}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{order.total} DZD</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === "packages" && (
            <div>
              <h2 className="text-lg font-bold mb-4 text-foreground">{t("my-packages", "Mes Colis", "حزمي")}</h2>
              {packageDeliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">{t("no-packages", "Aucun colis", "لا توجد حزم")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {packageDeliveries.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className="border-border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setOrderId(pkg.id)
                        setCurrentOrder(pkg)
                        setCurrentPage("tracking")
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                className={
                                  pkg.status === "DELIVERED"
                                    ? "bg-green-500"
                                    : pkg.status === "IN_DELIVERY"
                                      ? "bg-blue-500"
                                      : "bg-yellow-500"
                                }
                              >
                                {pkg.status === "DELIVERED"
                                  ? t("delivered", "Livrée", "تم التوصيل")
                                  : pkg.status === "IN_DELIVERY"
                                    ? t("in-delivery", "En Livraison", "قيد التوصيل")
                                    : t("pending", "En Attente", "قيد الانتظار")}
                              </Badge>
                              <span className="text-sm font-mono text-muted-foreground">#{pkg.id}</span>
                            </div>
                            <p className="font-semibold text-foreground mb-1">{pkg.packageDescription}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("to", "Vers", "إلى")}: {pkg.recipientName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{pkg.total} DZD</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Track Order Tab */}
          {activeTab === "track" && (
            <div>
              <h2 className="text-lg font-bold mb-4 text-foreground">
                {t("track-order", "Suivre Commande", "تتبع الطلب")}
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        {t("enter-order-id", "Entrez le numéro de commande", "أدخل رقم الطلب")}
                      </label>
                      <Input
                        type="text"
                        placeholder={t("order-id-placeholder", "Ex: ORD-123456", "مثال: ORD-123456")}
                        className="bg-muted border-border"
                      />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-bold py-6 rounded-full">
                      {t("track", "Suivre", "تتبع")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  const CategoryView = () => {
    const category = categories.find((c) => c.id === selectedCategory)
    if (!category) return null

    const categoryName = selectedLanguage === "ar" ? category.nameAr : category.nameFr
    const Icon = category.icon

    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-[57px] z-40 bg-background border-b border-border px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentPage("home")
                setSelectedCategory(null)
              }}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">{categoryName}</h1>
          </div>
        </div>

        {/* Category Header */}
        <div className={`bg-gradient-to-br ${category.color} px-4 py-8 relative overflow-hidden`}>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-1">{categoryName}</h1>
            <p className="text-white/90 text-sm">
              {t("fast-delivery", "Livraison rapide à votre porte", "توصيل سريع إلى بابك")}
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
            <Icon className="w-32 h-32 text-white" />
          </div>
        </div>

        {/* Store Listings */}
        <div className="px-4 py-6">
          <h2 className="text-lg font-bold mb-4 text-foreground">
            {t("available-stores", "Magasins disponibles", "المتاجر المتاحة")}
          </h2>
          <div className="space-y-4">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border"
                onClick={() => {
                  setSelectedStore(store.id)
                  setCurrentPage("store")
                }}
              >
                <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50">
                  <img
                    src="/placeholder.jpg"
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1">
                    {t("free", "Gratuit", "مجاني")}
                  </Badge>
                </div>

                <CardContent className="p-3">
                  <h3 className="font-bold text-base mb-1 text-foreground">{store.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{store.rating}%</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{store.deliveryTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Store View Component
  const StoreView = () => {
    const store = stores.find((s) => s.id === selectedStore)
    const storeProducts = products.filter((p) => p.storeId === selectedStore)
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null)

    if (!store) return null

    // Product Detail View
    if (selectedProduct) {
      const product = products.find((p) => p.id === selectedProduct)
      if (!product) return null

      return (
        <div className="min-h-screen bg-background pb-24">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)} className="hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <Star className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="w-full aspect-square bg-background flex items-center justify-center p-8">
            <div className="w-full h-full max-w-md mx-auto rounded-full overflow-hidden shadow-xl">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="px-4 py-6 space-y-6 bg-card rounded-t-3xl -mt-6 relative z-10 shadow-lg">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-foreground flex-1">{product.name}</h2>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary">{product.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">DZD</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut
              laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation
              ullamcorper suscipit lobortis nisl ut.
            </p>

            {/* Quantity and Order */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-3">
                <button aria-label="Decrease quantity" className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="text-lg font-bold w-12 text-center text-foreground">01</span>
                <button aria-label="Increase quantity" className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-bold py-6 rounded-full text-lg shadow-lg"
                onClick={() => {
                  addToCart(product.id)
                  setSelectedProduct(null)
                }}
              >
                {t("add-to-cart", "Ajouter au Panier", "أضف إلى السلة")}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Store Listing View
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentPage("category")
                setSelectedStore(null)
              }}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-card p-6 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
              <UtensilsCrossed className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1">{store.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">{store.type}</p>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{store.rating}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{store.deliveryTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-4 py-6">
          <h3 className="text-lg font-bold text-foreground mb-4">{t("menu", "Menu", "القائمة")}</h3>
          <div className="grid grid-cols-2 gap-4">
            {storeProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border bg-card"
                onClick={() => setSelectedProduct(product.id)}
              >
                <div className="aspect-square relative bg-muted flex items-center justify-center">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">{product.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{product.price} DZD</span>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground rounded-full px-4 text-xs"
                    >
                      {t("add", "Ajouter", "أضف")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Checkout Component
  const CheckoutView = () => {
    const subtotal = getCartTotal()
    const deliveryFee = 500
    const total = subtotal + deliveryFee

    return (
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-3xl">
        <Button variant="ghost" onClick={() => setCurrentPage("home")} className="mb-4">
          ← {t("continue-shopping", "Continuer les achats", "متابعة التسوق")}
        </Button>

        <h2 className="text-2xl font-bold mb-6 text-foreground">{t("my-cart", "Mon Panier", "سلتي")}</h2>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                {t("empty-cart", "Votre panier est vide", "سلتك فارغة")}
              </p>
              <Button onClick={() => setCurrentPage("home")}>
                {t("start-shopping", "Commencer vos achats", "ابدأ التسوق")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId)
                  if (!product) return null

                  return (
                    <div key={item.productId} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 truncate text-foreground">{product.name}</h4>
                        <p className="text-sm text-primary font-semibold">{product.price} DZD</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                        <Button
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold whitespace-nowrap text-foreground">
                          {product.price * item.quantity} DZD
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-destructive hover:text-destructive h-auto p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t("order-summary", "Résumé de la commande", "ملخص الطلب")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("items-total", "Total des articles", "مجموع العناصر")}</span>
                  <span>{subtotal} DZD</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("tax", "Taxe", "ضريبة")}</span>
                  <span>0 DZD</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("delivery-fee", "Frais de livraison", "رسوم التوصيل")}</span>
                  <span>{deliveryFee} DZD</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t">
                  <span>{t("total", "Total", "المجموع")}</span>
                  <span className="text-primary">{total} DZD</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>{t("payment-method", "Mode de paiement", "طريقة الدفع")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-primary rounded-lg cursor-pointer bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {t("cash-on-delivery", "Paiement à la Livraison", "الدفع عند الاستلام")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("pay-cash", "Payez en espèces lors de la réception", "ادفع نقدًا عند الاستلام")}
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {t("recommended", "Recommandé", "موصى به")}
                  </Badge>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-not-allowed opacity-50">
                  <input type="radio" name="payment" value="card" disabled className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {t("credit-card", "Carte Bancaire", "بطاقة ائتمان")}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("coming-soon", "Bientôt disponible", "قريبًا")}</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button size="lg" className="w-full text-lg rounded-full" onClick={placeOrder}>
              {t("pay-now", "Payer Maintenant", "ادفع الآن")} - {total} DZD
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Tracking View Component
  const TrackingView = () => {
    // Helper function to determine the current step based on order status
    const getStepFromStatus = (status: string) => {
      switch (status) {
        case "pending":
        case "accepted":
          return 1
        case "preparing":
          return 2
        case "ready":
        case "assigned":
        case "IN_DELIVERY":
          return 3
        case "DELIVERED":
          return 4
        default:
          return 1
      }
    }

    const currentStep = currentOrder ? getStepFromStatus(currentOrder.status) : 1

    const steps = [
      {
        id: 1,
        label: t("order-accepted", "Commande Acceptée", "تم قبول الطلب"),
        icon: CheckCircle2,
        status: ["pending", "accepted"],
      },
      { id: 2, label: t("preparing", "En Préparation", "قيد التحضير"), icon: Package, status: ["preparing"] },
      {
        id: 3,
        label: t("in-delivery", "En Livraison", "قيد التوصيل"),
        icon: Truck,
        status: ["ready", "assigned", "IN_DELIVERY"],
      },
      { id: 4, label: t("delivered", "Livrée", "تم التوصيل"), icon: CheckCircle2, status: ["DELIVERED"] },
    ]

    // Helper function to get a descriptive status text
    const getStatusText = (status: string) => {
      switch (status) {
        case "pending":
          return t("status-pending", "En attente d'acceptation par le restaurant", "في انتظار قبول المطعم")
        case "accepted":
          return t("status-accepted", "Commande acceptée par le restaurant", "تم قبول الطلب من قبل المطعم")
        case "preparing":
          return t("status-preparing", "Votre commande est en cours de préparation", "طلبك قيد التحضير")
        case "ready":
          return t("status-ready", "Commande prête, en attente d'un livreur", "الطلب جاهز، في انتظار السائق")
        case "assigned":
          return t("status-assigned", "Un livreur a été assigné à votre commande", "تم تعيين سائق لطلبك")
        case "IN_DELIVERY":
          return t("status-in-delivery", "Votre commande est en cours de livraison", "طلبك قيد التوصيل")
        case "DELIVERED":
          return t("status-delivered", "Commande livrée avec succès", "تم توصيل الطلب بنجاح")
        default:
          return t("status-unknown", "Statut inconnu", "حالة غير معروفة")
      }
    }

    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2 text-foreground">
              {currentOrder?.status === "DELIVERED"
                ? t("order-delivered", "Commande Livrée!", "تم توصيل الطلب!")
                : t("order-confirmed", "Commande Confirmée!", "تم تأكيد الطلب!")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("order-number", "Numéro de commande", "رقم الطلب")}:{" "}
              <span className="font-mono font-semibold">{orderId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {currentOrder && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-primary">{getStatusText(currentOrder.status)}</p>
              </div>
            )}

            <div className="space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep >= step.id
                const isCurrent = currentStep === step.id
                const isLast = index === steps.length - 1

                return (
                  <div key={step.id} className="relative">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isActive ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"} ${isCurrent ? "text-primary" : ""}`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("in-progress", "En cours...", "جاري...")}
                          </p>
                        )}
                      </div>
                    </div>
                    {!isLast && (
                      <div
                        className={`absolute left-6 top-12 w-0.5 h-6 transition-all ${isActive ? "bg-primary" : "bg-border"}`}
                      ></div>
                    )}
                  </div>
                )
              })}
            </div>

            {currentOrder && (
              <div className="bg-muted rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-foreground">
                  {t("order-details", "Détails de la commande", "تفاصيل الطلب")}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("total", "Total", "المجموع")}</span>
                    <span className="font-semibold text-foreground">{currentOrder.total} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("payment", "Paiement", "الدفع")}</span>
                    <span className="font-semibold text-foreground">
                      {currentOrder.paymentMethod === "cash"
                        ? t("cash", "Espèces", "نقدي")
                        : t("card", "Carte", "بطاقة")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("delivery", "Livraison", "التوصيل")}</span>
                    <span className="font-semibold text-foreground">{currentOrder.city}</span>
                  </div>
                </div>
              </div>
            )}

            {currentOrder?.status === "DELIVERED" ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
                <p className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  {t("thank-you", "Merci pour votre commande!", "شكرا لطلبك!")}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("see-you-soon", "Nous espérons vous revoir bientôt.", "نأمل أن نراك قريبًا.")}
                </p>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-6 text-center">
                <p className="text-lg font-semibold mb-2 text-foreground">
                  {t("thank-you", "Merci pour votre commande!", "شكرا لطلبك!")}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    "delivery-message",
                    "Votre commande sera livrée dans les plus brefs délais. Vous pouvez payer en espèces à la livraison.",
                    "سيتم توصيل طلبك في أقرب وقت ممكن. يمكنك الدفع نقدًا عند الاستلام.",
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setCurrentPage("home")
                  setOrderId(null)
                  setCurrentOrder(null)
                }}
              >
                {t("back-home", "Retour à l'accueil", "العودة إلى الصفحة الرئيسية")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const ProfileView = () => (
    <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")} className="hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{t("profile", "Profil", "الملف الشخصي")}</h1>
      </div>

      <div className="space-y-6">
        {/* User Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {user?.name || t("user", "Utilisateur", "مستخدم")}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              {t("edit-profile", "Modifier le profil", "تعديل الملف الشخصي")}
            </Button>
          </CardContent>
        </Card>

        {/* Settings Options */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings", "Paramètres", "الإعدادات")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Language Setting */}
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{t("language", "Langue", "اللغة")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLanguage === "fr" ? "Français" : selectedLanguage === "ar" ? "العربية" : "English"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Language Dropdown */}
            {showLanguageMenu && (
              <div className="ml-12 space-y-1 pb-2">
                <button
                  onClick={() => {
                    setSelectedLanguage("fr")
                    setShowLanguageMenu(false)
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedLanguage === "fr" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => {
                    setSelectedLanguage("ar")
                    setShowLanguageMenu(false)
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedLanguage === "ar" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                  }`}
                >
                  العربية
                </button>
              </div>
            )}

            {/* Notifications */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{t("notifications", "Notifications", "الإشعارات")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("manage-notifications", "Gérer les notifications", "إدارة الإشعارات")}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Location */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{t("addresses", "Adresses", "العناوين")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("manage-addresses", "Gérer vos adresses", "إدارة عناوينك")}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Help */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{t("help", "Aide & Support", "المساعدة والدعم")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("faq", "FAQ et contact", "الأسئلة الشائعة والاتصال")}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t("logout", "Se déconnecter", "تسجيل الخروج")}
        </Button>
      </div>
    </div>
  )

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around py-2 px-4">
        <button
          onClick={() => {
            setCurrentPage("home")
            setSelectedCategory(null)
            setSelectedStore(null)
          }}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentPage === "home" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">{t("home", "Accueil", "الرئيسية")}</span>
        </button>
        <button
          onClick={() => setCurrentPage("checkout")}
          className={`flex flex-col items-center gap-1 py-1 transition-colors relative ${
            currentPage === "checkout" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          )}
          <span className="text-xs font-medium">{t("cart", "Panier", "السلة")}</span>
        </button>
        <button
          onClick={() => setCurrentPage("orders")}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentPage === "orders" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Package className="w-6 h-6" />
          <span className="text-xs font-medium">{t("orders", "Commandes", "الطلبات")}</span>
        </button>
        <button
          onClick={() => setCurrentPage("profile")}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentPage === "profile" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-medium">{t("profile", "Profil", "الملف الشخصي")}</span>
        </button>
      </div>
    </nav>
  )

  // Main Render
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {currentPage === "home" && <HomePage />}
        {currentPage === "category" && <CategoryView />}
        {currentPage === "store" && <StoreView />}
        {currentPage === "checkout" && <CheckoutView />}
        {currentPage === "tracking" && <TrackingView />}
        {currentPage === "orders" && <MyOrdersView />}
        {currentPage === "profile" && <ProfileView />}
      </main>
      <BottomNav />
    </div>
  )
}
