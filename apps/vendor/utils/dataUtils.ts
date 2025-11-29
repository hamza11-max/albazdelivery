"use client"

import type { Sale, InventoryProduct, SaleItem } from "@/root/lib/types"
import type { SalesData, OrdersData, ProductsData, CustomersData, SuppliersData, CategoriesData, TopProductData } from "../app/vendor/types"
import { handleError } from "./errorHandling"

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

