"use client"

import type { Sale, InventoryProduct, SaleItem } from "@/root/lib/types"
import type { SalesData, OrdersData, ProductsData, CustomersData, SuppliersData, CategoriesData, TopProductData } from "../app/vendor/types"
import { handleError, safeLocalStorageGet } from "./errorHandling"
import { getMergedLocalSalesHistory, isElectronOfflineInventoryVendorId } from "./electronUtils"

/** Merge API sales with local/offline history (`electron-sales` + `offline-sales-queue`). */
function mergeApiSalesWithLocalHistory(apiSales: Sale[]): Sale[] {
  if (typeof window === "undefined") return apiSales
  const localMerged = getMergedLocalSalesHistory()
  if (localMerged.length === 0) return apiSales

  const byId = new Map<string, Sale>()
  for (const s of apiSales) {
    byId.set(String(s.id), s)
  }
  for (const s of localMerged) {
    const id = String(s.id)
    if (!byId.has(id)) {
      byId.set(id, s)
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

interface HandleDataLoadParams {
  vendorContextId?: string
  fetchSales: (vendorId?: string) => Promise<Sale[]>
  fetchOrders: (vendorId?: string) => Promise<any[]>
  fetchProducts: (vendorId?: string) => Promise<InventoryProduct[] | null>
  fetchCustomers: (vendorId?: string) => Promise<any[]>
  fetchSuppliers: (vendorId?: string) => Promise<any[]>
  fetchCategories: (vendorId?: string) => Promise<any[]>
  setSales: (sales: Sale[]) => void
  setOrders: (orders: any[]) => void
  setProducts: (products: InventoryProduct[]) => void
  setLowStockProducts: (products: InventoryProduct[]) => void
  setCustomers: (customers: any[]) => void
  setSuppliers: (suppliers: any[]) => void
  setCategories: (categories: any[]) => void
  setTodaySales: (amount: number) => void
  setWeekSales: (amount: number) => void
  setMonthSales: (amount: number) => void
  setTopProducts: (products: TopProductData[]) => void
  setLoadingState: (state: any) => void
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
}

export async function handleDataLoad({
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
}: HandleDataLoadParams) {
  try {
    const vid = vendorContextId ?? ''
    const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron
    const useLocalProducts = isElectron && isElectronOfflineInventoryVendorId(vid)

    const productsPromise = useLocalProducts
      ? Promise.resolve(JSON.parse(typeof localStorage !== 'undefined' ? (localStorage.getItem('electron-inventory') || '[]') : '[]') as InventoryProduct[])
      : fetchProducts(vendorContextId)

    const safeFetch = (p: Promise<any>) => p.catch(() => null)
    const [salesRes, ordersRes, productsRes, customersRes, suppliersRes, categoriesRes] = useLocalProducts
      ? await Promise.all([
          safeFetch(fetchSales(vendorContextId)),
          safeFetch(fetchOrders(vendorContextId)),
          productsPromise,
          safeFetch(fetchCustomers(vendorContextId)),
          safeFetch(fetchSuppliers(vendorContextId)),
          safeFetch(fetchCategories(vendorContextId)),
        ])
      : await Promise.all([
          fetchSales(vendorContextId),
          fetchOrders(vendorContextId),
          productsPromise,
          fetchCustomers(vendorContextId),
          fetchSuppliers(vendorContextId),
          fetchCategories(vendorContextId),
        ])

    // Transform responses into proper data types (null from offline mode → empty arrays)
    const rawSales = Array.isArray(salesRes) ? salesRes : []
    const salesData = {
      sales: mergeApiSalesWithLocalHistory(rawSales as Sale[]),
    } as SalesData
    const ordersData = { orders: Array.isArray(ordersRes) ? ordersRes : [] } as OrdersData
    const productsData = { products: Array.isArray(productsRes) ? productsRes : [] } as ProductsData
    const customersData = { customers: Array.isArray(customersRes) ? customersRes : [] } as CustomersData
    const suppliersData = { suppliers: Array.isArray(suppliersRes) ? suppliersRes : [] } as SuppliersData
    const categoriesData = { categories: Array.isArray(categoriesRes) ? categoriesRes : [] } as CategoriesData

    // Update state with fetched data
    setSales(salesData.sales)
    setOrders(ordersData.orders)
    setProducts(productsData.products)
    const lowStock = productsData.products.filter(
      (p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)
    )
    setLowStockProducts(lowStock)
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
    setLoadingState((prev: any) => ({
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
    handleError(error, {
      showToast: true,
      logError: true,
      translate,
      toast,
      fallbackMessage: {
        fr: "Impossible de charger les données du tableau de bord",
        ar: "تعذر تحميل بيانات لوحة التحكم"
      }
    })
    setLoadingState((prev: any) => ({
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
}

