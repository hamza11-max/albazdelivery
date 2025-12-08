"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import type { Order } from '@albaz/shared'

import { useSSE } from '@/lib/use-sse'
import { BottomNav } from '../components/navigation/BottomNav'
import { HomePage } from '../components/views/HomePage'
import { CategoryView } from '../components/views/CategoryView'
import { StoreView } from '../components/views/StoreView'
import { CheckoutView } from '../components/views/CheckoutView'
import { MyOrdersView } from '../components/views/MyOrdersView'
import { TrackingView } from '../components/views/TrackingView'
import { ProfileView } from '../components/views/ProfileView'
import { cities } from '../lib/mock-data'
import type { CartItem, PageView, TranslationFn } from '../lib/types'
import { useCategoriesQuery } from '../hooks/use-categories-query'
import { useStoresQuery } from '../hooks/use-stores-query'
import { useProductsQuery } from '../hooks/use-products-query'
import { useRealtimeUpdates } from '../hooks/use-realtime-updates'
import { useCreateOrder } from '../hooks/use-orders-mutation'

export const dynamic = 'force-dynamic'

export default function AlBazApp() {
  const router = useRouter()
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? 'loading'
  const user = session?.user ?? null

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageView>('home')
  const [selectedCity] = useState(() => cities[cities.length - 1] ?? 'Tamanrasset')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('fr')
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  const customerId = user?.id || 'customer-1'
  const shouldUseSSE = currentPage === 'tracking' && Boolean(orderId)
  const { data: sseData } = useSSE(`/api/notifications/sse?role=customer&userId=${customerId}`, shouldUseSSE)

  // Enable real-time updates via WebSocket
  useRealtimeUpdates(true)

  // Order creation mutation
  const createOrder = useCreateOrder()

  // Fetch categories from API with React Query
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery()

  // Fetch stores based on selected category and search with React Query
  const { data: apiStores = [], isLoading: storesLoading } = useStoresQuery({
    categoryId: selectedCategory || undefined,
    city: selectedCity,
    search: searchQuery || undefined,
  })

  // Fetch products for selected store with React Query
  const { data: apiProducts = [], isLoading: productsLoading } = useProductsQuery(selectedStore)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (sseData?.type === 'order_updated' && sseData.order?.id === orderId) {
      setCurrentOrder(sseData.order)
      // Logger will only output in development
      if (process.env.NODE_ENV === 'development') {
        console.info('[v0] Order updated via SSE:', sseData.order)
      }
    }
  }, [sseData, orderId])

  useEffect(() => {
    if (orderId && currentPage === 'tracking') {
      const fetchOrder = async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`)
          const data = await response.json()
          if (data.success) {
            setCurrentOrder(data.order)
          }
        } catch (error) {
          console.error('[v0] Error fetching order:', error)
        }
      }
      fetchOrder()
      const interval = setInterval(fetchOrder, 5000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [orderId, currentPage])

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated') return
    if (status === 'authenticated' && user?.role && user.role !== 'CUSTOMER') {
      const dest =
        user.role === 'ADMIN'
          ? '/admin'
          : user.role === 'VENDOR'
            ? '/vendor'
            : user.role === 'DRIVER'
              ? '/driver'
              : '/'
      router.push(dest)
    }
  }, [status, user, router])

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    document.documentElement.lang = selectedLanguage
    document.documentElement.dir = selectedLanguage === 'ar' ? 'rtl' : 'ltr'
  }, [selectedLanguage])

  // Transform API stores to match expected format (using string IDs directly)
  const filteredStores = useMemo(() => {
    return apiStores.map((store: { id: string; name: string; type: string; rating: number; deliveryTime?: string; categoryId: number }) => ({
      id: store.id, // Use string ID directly
      name: store.name,
      type: store.type,
      rating: store.rating,
      deliveryTime: store.deliveryTime || '30-45 min',
      categoryId: store.categoryId,
    }))
  }, [apiStores])

  // Transform API products to match expected format (using string IDs directly)
  const products = useMemo(() => {
    return apiProducts.map((product: { id: string; storeId: string; name: string; description: string; price: number; image?: string | null; rating: number }) => ({
      id: product.id, // Use string ID directly
      storeId: product.storeId, // Use string ID directly
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image || '/placeholder.svg',
      rating: product.rating,
    }))
  }, [apiProducts])

  // All hooks must be called before any conditional returns
  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const product = products.find((p: { id: string | number }) => String(p.id) === String(item.productId))
        return total + (product?.price || 0) * item.quantity
      }, 0),
    [cart, products],
  )

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d1a] mx-auto" />
          <p className="mt-4 text-[#1a4d1a]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const t: TranslationFn = (_key, fr, ar) => (selectedLanguage === 'ar' ? ar : fr)

  // Memoized cart handlers to prevent unnecessary re-renders
  const addToCart = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { productId, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const deliveryFee = 500 // DZD - TODO: import from constants after webpack config fix
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const total = useMemo(() => {
    const discount = Math.min(promoDiscount, subtotal)
    return Math.max(0, subtotal - discount + deliveryFee)
  }, [subtotal, promoDiscount, deliveryFee])

  const applyPromo = useCallback(
    (codeRaw: string) => {
      const code = codeRaw.toUpperCase()
      if (!code) {
        setPromoError(t('promo-required', 'Entrez un code promo', 'أدخل رمزاً ترويجياً'))
        return
      }

      let discount = 0
      if (code === 'WELCOME10') {
        discount = Math.min(Math.round(subtotal * 0.1), 1000)
      } else if (code === 'SAVE15') {
        discount = Math.min(Math.round(subtotal * 0.15), 1500)
      } else {
        setPromoError(t('promo-invalid', 'Code promo invalide', 'رمز غير صالح'))
        setPromoCode(code)
        setPromoDiscount(0)
        return
      }

      setPromoCode(code)
      setPromoDiscount(discount)
      setPromoError(null)
    },
    [subtotal, t],
  )

  const clearPromo = useCallback(() => {
    setPromoCode('')
    setPromoDiscount(0)
    setPromoError(null)
  }, [])

  useEffect(() => {
    if (promoCode) {
      applyPromo(promoCode)
    }
  }, [subtotal, promoCode, applyPromo])

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) {
      alert(t('cart-empty', 'Votre panier est vide', 'سلتك فارغة'))
      return
    }

    if (!selectedStore) {
      alert(t('store-required', 'Veuillez sélectionner un magasin', 'يرجى اختيار متجر'))
      return
    }

    const orderData = {
      storeId: selectedStore,
      items: cart.map((item) => {
        const prod = products.find((p: { id: string | number }) => String(p.id) === String(item.productId))
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: prod?.price || 0,
        }
      }),
      subtotal,
      deliveryFee,
      total,
      discount: promoDiscount,
      promoCode: promoCode || undefined,
      paymentMethod,
      deliveryAddress: '123 Rue Example, Appartement 4',
      city: selectedCity,
      customerPhone: '+213555000000',
    }

    try {
      const result = await createOrder.mutateAsync(orderData)
      
      if (result?.order) {
        setOrderId(result.order.id)
        setCurrentOrder(result.order)
        setCurrentPage('tracking')
        setCart([])
        if (process.env.NODE_ENV === 'development') {
          console.info('[v0] Order placed successfully:', result.order.id)
        }
      }
    } catch (error) {
      // Error already handled by useCreateOrder hook with toast notification
      console.error('[v0] Error placing order:', error)
    }
  }, [cart, selectedStore, products, subtotal, deliveryFee, total, promoDiscount, promoCode, paymentMethod, selectedCity, createOrder, t])

  const handleResetSelections = () => {
    setSelectedCategory(null)
    setSelectedStore(null)
  }

  const handleGoHome = () => {
    setCurrentPage('home')
    handleResetSelections()
  }

  const handleOrderSelect = (order: Order) => {
    setOrderId(order.id)
    setCurrentOrder(order)
    setCurrentPage('tracking')
  }

  const handleSignOut = () => signOut({ callbackUrl: '/login' })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to go back/home
      if (e.key === 'Escape' && currentPage !== 'home') {
        if (currentPage === 'store' || currentPage === 'category') {
          handleGoHome()
        }
      }
      // Ctrl/Cmd + K for search focus (if on home page)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && currentPage === 'home') {
        e.preventDefault()
        // Focus search input (would need ref in HomePage)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, handleGoHome])

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        {t('skip-to-content', 'Aller au contenu principal', 'انتقل إلى المحتوى الرئيسي')}
      </a>
      <main id="main-content">
        {currentPage === 'home' && (
          <HomePage
            categories={categories}
            selectedLanguage={selectedLanguage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCategorySelect={(categoryId: number) => {
              setSelectedCategory(categoryId)
              setCurrentPage('category')
            }}
            onPackageDelivery={() => router.push('/package-delivery')}
            selectedCity={selectedCity}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            onGoHome={handleGoHome}
            t={t}
          />
        )}

        {currentPage === 'category' && (
          <CategoryView
            selectedCategory={selectedCategory}
            categories={categories}
            filteredStores={filteredStores}
            isLoading={storesLoading}
            onBack={handleGoHome}
            onStoreSelect={(storeId: string) => {
              setSelectedStore(storeId)
              setCurrentPage('store')
            }}
            selectedLanguage={selectedLanguage}
            t={t}
          />
        )}

        {currentPage === 'store' && (
          <StoreView
            selectedStore={selectedStore}
            stores={filteredStores}
            products={products}
            isLoading={productsLoading}
            onBack={() => setCurrentPage('category')}
            addToCart={addToCart}
            t={t}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutView
            cart={cart}
            products={products}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            promoCode={promoCode}
            promoDiscount={promoDiscount}
            promoError={promoError || undefined}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onPlaceOrder={placeOrder}
            onContinueShopping={handleGoHome}
            onApplyPromo={applyPromo}
            onClearPromo={clearPromo}
            t={t}
          />
        )}

        {currentPage === 'orders' && (
          <MyOrdersView customerId={customerId} onBack={handleGoHome} onOrderSelect={handleOrderSelect} t={t} />
        )}

        {currentPage === 'tracking' && (
          <TrackingView currentOrder={currentOrder} orderId={orderId} onBackHome={handleGoHome} t={t} />
        )}

        {currentPage === 'profile' && (
          <ProfileView
            user={user}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onBackHome={handleGoHome}
            onSignOut={handleSignOut}
            t={t}
          />
        )}
      </main>

      <BottomNav
        currentPage={currentPage}
        cartItemCount={cartItemCount}
        onNavigate={setCurrentPage}
        onResetSelection={handleResetSelections}
        t={t}
      />
    </div>
  )
}

