"use client"

import { useEffect, useMemo, useState } from 'react'
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
import { categories, stores, products, cities } from '../lib/mock-data'
import type { CartItem, PageView, TranslationFn } from '../lib/types'

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
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [selectedLanguage, setSelectedLanguage] = useState('fr')
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  const customerId = user?.id || 'customer-1'
  const shouldUseSSE = currentPage === 'tracking' && Boolean(orderId)
  const { data: sseData } = useSSE(`/api/notifications/sse?role=customer&userId=${customerId}`, shouldUseSSE)

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

  // All hooks must be called before any conditional returns
  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const product = products.find((p) => p.id === item.productId)
        return total + (product?.price || 0) * item.quantity
      }, 0),
    [cart],
  )

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesCategory = selectedCategory ? store.categoryId === selectedCategory : true
      const query = searchQuery.toLowerCase()
      const matchesSearch = store.name.toLowerCase().includes(query) || store.type.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

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

  const addToCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { productId, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const deliveryFee = 500 // DZD - TODO: import from constants after webpack config fix
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0) return

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
      total: subtotal + deliveryFee,
      paymentMethod,
      deliveryAddress: '123 Rue Example, Appartement 4',
      city: selectedCity,
      customerPhone: '+213555000000',
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        setOrderId(data.order.id)
        setCurrentOrder(data.order)
        setCurrentPage('tracking')
        setCart([])
        if (process.env.NODE_ENV === 'development') {
          console.info('[v0] Order placed successfully:', data.order.id)
        }
      } else {
        console.error('[v0] Failed to place order:', data.error)
        alert(t('order-error', 'Erreur lors de la commande. Veuillez réessayer.', 'خطأ في الطلب. يرجى المحاولة مرة أخرى.'))
      }
    } catch (error) {
      console.error('[v0] Error placing order:', error)
      alert(t('order-error', 'Erreur lors de la commande. Veuillez réessayer.', 'خطأ في الطلب. يرجى المحاولة مرة أخرى.'))
    }
  }

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

  return (
    <div className="min-h-screen bg-background">
      <main>
        {currentPage === 'home' && (
          <HomePage
            categories={categories}
            selectedLanguage={selectedLanguage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCategorySelect={(categoryId) => {
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
            onBack={handleGoHome}
            onStoreSelect={(storeId) => {
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
            stores={stores}
            products={products}
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
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onPlaceOrder={placeOrder}
            onContinueShopping={handleGoHome}
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

