"use client"

import type { Sale } from "@/root/lib/types"
import type { CartItem } from "../app/vendor/types"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError, ValidationError } from "./errorHandling"

interface CompleteSaleParams {
  paymentMethod: "cash" | "card"
  posCart: CartItem[]
  posDiscount: number
  posTaxPercent: number
  posCustomerId: number | null
  isElectronRuntime: boolean
  activeVendorId?: string
  isAdmin: boolean
  setSales: (sales: Sale[]) => void
  setTodaySales: (amount: number) => void
  setWeekSales: (amount: number) => void
  setMonthSales: (amount: number) => void
  setProducts: (products: any[]) => void
  setLowStockProducts: (products: any[]) => void
  setLastSale: (sale: Sale | null) => void
  setCompletedSale: (sale: Sale | null) => void
  setShowSaleSuccessDialog: (show: boolean) => void
  clearCart: () => void
  setPosTax: (tax: number) => void
  setPosCustomerId: (id: number | null) => void
  setPosOrderNumber: (orderNumber: string) => void
  fetchDashboardData: (vendorId?: string) => Promise<any>
  fetchInventory: (vendorId?: string) => Promise<any>
  fetchSales: (vendorId?: string) => Promise<any>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  isArabic?: boolean
  setOfflineQueueCount?: (count: number) => void
  isAcceptingOrders?: boolean
}

export async function completeSale({
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
  isArabic = false,
  setOfflineQueueCount,
  isAcceptingOrders,
}: CompleteSaleParams) {
  if (isAcceptingOrders === false) {
    toast({
      title: translate("Commandes en pause", "تم إيقاف الطلبات"),
      description: translate("Réactivez la prise de commandes dans Paramètres", "فعّل استقبال الطلبات من الإعدادات"),
      variant: "destructive",
    })
    return false
  }

  if (posCart.length === 0) {
    toast({
      title: translate("Panier vide", "السلة فارغة"),
      description: translate("Ajoutez des produits au panier avant de finaliser la vente", "أضِف منتجات إلى السلة قبل إتمام عملية البيع."),
      variant: "destructive",
    })
    return
  }

  const subtotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = (subtotal - posDiscount) * (posTaxPercent / 100) // Adjustable tax percentage
  // API expects: total === subtotal - discount (without tax)
  // But we display total with tax in UI
  const totalForAPI = subtotal - posDiscount
  const totalWithTax = subtotal - posDiscount + tax

  // For Electron with local products: save sale locally (and push to offline DB if available)
  if (isElectronRuntime) {
    const electronAPI = (globalThis as any)?.electronAPI
    let storedSales = safeLocalStorageGet<Sale[]>('electron-sales', [])
    const localSale: Sale = {
      id: `sale-${Date.now()}`,
      items: posCart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      })),
      subtotal,
      discount: posDiscount || 0,
      total: totalWithTax,
      paymentMethod: paymentMethod,
      createdAt: new Date(),
    }
    
    // Try offline SQLite via Electron; fallback to localStorage
    try {
      if (electronAPI?.offline?.saveSale) {
        await electronAPI.offline.saveSale({
          ...localSale,
          vendorId: activeVendorId,
          tax,
          discount: posDiscount || 0,
        })
        const stats = await electronAPI.offline.getStats?.()
        if (stats?.pendingSales != null && setOfflineQueueCount) {
          setOfflineQueueCount(stats.pendingSales)
        }
      } else {
        storedSales = safeLocalStorageGet<Sale[]>('electron-sales', [])
        storedSales.push(localSale)
        if (!safeLocalStorageSet('electron-sales', storedSales)) {
          throw new Error('Failed to save sale to localStorage')
        }
        setSales(storedSales)
      }
    } catch (error) {
      console.warn('[Electron] Failed to persist sale offline, falling back to memory/localStorage', error)
      storedSales = safeLocalStorageGet<Sale[]>('electron-sales', [])
      storedSales.push(localSale)
      safeLocalStorageSet('electron-sales', storedSales)
      setSales(storedSales)
    }
    
    // Update dashboard stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    setTodaySales(storedSales.filter((s: any) => new Date(s.createdAt) >= todayStart).reduce((sum: number, s: any) => sum + (s.total || 0), 0))
    setWeekSales(storedSales.filter((s: any) => new Date(s.createdAt) >= weekStart).reduce((sum: number, s: any) => sum + (s.total || 0), 0))
    setMonthSales(storedSales.filter((s: any) => new Date(s.createdAt) >= monthStart).reduce((sum: number, s: any) => sum + (s.total || 0), 0))
    
    // Update stock locally
    const storedProducts = safeLocalStorageGet<any[]>('electron-inventory', [])
    posCart.forEach(cartItem => {
      const product = storedProducts.find((p: any) => p.id === cartItem.productId)
      if (product) {
        product.stock = Math.max(0, product.stock - cartItem.quantity)
      }
    })
    if (!safeLocalStorageSet('electron-inventory', storedProducts)) {
      console.warn('Failed to update product stock in localStorage')
    }
    setProducts(storedProducts)
    setLowStockProducts(storedProducts.filter((p: any) => p.stock <= (p.lowStockThreshold ?? 10)))
    
    // Show success
    setLastSale(localSale)
    setCompletedSale(localSale)
    setShowSaleSuccessDialog(true)
    clearCart()
    setPosTax(0)
    setPosCustomerId(null)
    setPosOrderNumber(`ORD-${Date.now().toString().slice(-6)}`)
    
    toast({
      title: translate("Vente complétée", "تمت عملية البيع"),
      description: translate("Sauvegardée localement", "تم الحفظ محلياً"),
    })
    return true
  }

  try {
    const salesUrl = `/api/erp/sales${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`
    
    // Transform cart items to match API schema
    // Products from API have string IDs (CUIDs), ensure they're strings
    const items = posCart.map(item => {
      const product = posCart.find((p: any) => String(p.productId) === String(item.productId))
      const stock = (product as any)?.stock
      if (typeof stock === "number" && stock <= 0) {
        throw new ValidationError(translate("Produit en rupture de stock", "المنتج غير متوفر"))
      }

      // ProductId should already be a string from API, but ensure it's a string
      const productId = item.productId 
        ? (typeof item.productId === 'string' ? item.productId : String(item.productId))
        : undefined
      
      return {
        productId: productId && productId.length > 0 ? productId : undefined,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      }
    })
    
    // Prepare payload - API expects CUID strings or undefined
    // Don't send customerId or vendorId if they're null/empty
    const payload: any = {
      items,
      subtotal,
      discount: posDiscount || 0,
      total: totalForAPI, // API expects: total === subtotal - discount (no tax)
      paymentMethod: paymentMethod.toUpperCase() as 'CASH' | 'CARD',
    }
    
    // Only include customerId if it's a valid string
    if (posCustomerId) {
      payload.customerId = typeof posCustomerId === 'string' 
        ? posCustomerId 
        : String(posCustomerId)
    }
    
    // Only include vendorId in body if admin (non-admin uses session)
    if (isAdmin && activeVendorId) {
      payload.vendorId = typeof activeVendorId === 'string'
        ? activeVendorId
        : String(activeVendorId)
    }
    
    console.log('[v0] Sale payload:', JSON.stringify(payload, null, 2))
    const response = await safeFetch(salesUrl, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    
    const data = await parseAPIResponse(response)
    
    if (!response.ok || !data.success) {
      let errorMessage = 'Unknown error'
      
      // Extract error message from validation errors or general error
      if (data.error?.details && Array.isArray(data.error.details)) {
        const validationErrors = data.error.details.map((detail: any) => {
          const path = detail.path || 'unknown'
          return `${path}: ${detail.message}`
        }).join(', ')
        errorMessage = `Validation error: ${validationErrors}`
      } else if (data.error?.issues && Array.isArray(data.error.issues)) {
        const validationErrors = data.error.issues.map((issue: any) => {
          const path = issue.path?.join('.') || 'unknown'
          return `${path}: ${issue.message}`
        }).join(', ')
        errorMessage = `Validation error: ${validationErrors}`
      } else {
        errorMessage = data.error?.message || data.message || `HTTP ${response.status}`
      }
      
      const apiError = new APIError(errorMessage, response.status, data)
      handleError(apiError, { showToast: true, logError: true, translate, toast })
      return false
    }
    
    if (data.success) {
      const saleWithTax = { ...data.sale, tax }
      setLastSale(saleWithTax)
      setCompletedSale(saleWithTax)
      setShowSaleSuccessDialog(true)
      clearCart()
      setPosTax(0)
      setPosCustomerId(null)
      setPosOrderNumber(`ORD-${Date.now().toString().slice(-6)}`)
      fetchDashboardData(activeVendorId)
      fetchInventory(activeVendorId)
      fetchSales(activeVendorId)
      toast({
        title: translate("Vente complétée", "تمت العملية"),
        description: isArabic
          ? `تم تسجيل عملية بيع بقيمة ${totalWithTax.toFixed(2)} ${translate("DZD", "دج")}.`
          : `Vente de ${totalWithTax.toFixed(2)} ${translate("DZD", "دج")} enregistrée avec succès.`,
      })
      return true
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Erreur lors de la vente", "خطأ في عملية البيع"),
        response.status,
        data
      )
      handleError(apiError, { showToast: true, logError: true, translate, toast })
      return false
    }
  } catch (error) {
    // Queue sale locally when offline/API fails
    try {
      const queued = safeLocalStorageGet<any[]>('offline-sales-queue', [])
      queued.push({
        id: `offline-${Date.now()}`,
        payload,
        createdAt: new Date().toISOString(),
        status: 'pending',
      })
      if (safeLocalStorageSet('offline-sales-queue', queued) && setOfflineQueueCount) {
        setOfflineQueueCount(queued.length)
      }
    } catch (queueError) {
      console.warn('[POS] Unable to queue offline sale', queueError)
    }

    handleError(error, {
      showToast: true,
      logError: true,
      translate,
      toast,
      fallbackMessage: {
        fr: "Une erreur est survenue lors de la vente",
        ar: "حدث خطأ أثناء عملية البيع"
      }
    })
    return false
  }
}

