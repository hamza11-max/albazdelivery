import { useState, useCallback } from 'react'
import { useFetchWithCache, type LoadingState } from "@/root/hooks/use-fetch-with-cache"
import type {
  Sale,
  Customer,
  Supplier,
  InventoryProduct,
  Order,
} from "@/root/lib/types"
import type { ApiResponse } from "@/root/lib/types/api"
import type { Category } from "@/root/lib/types/category"
import type {
  SalesData,
  CustomersData,
  SuppliersData,
  ProductsData,
  OrdersData,
  CategoriesData
} from "./types"

export function useDashboardData() {
  const [loadingState, setLoadingStateInternal] = useState<LoadingState>({
    sales: false,
    customers: false,
    suppliers: false,
    products: false,
    orders: false,
    categories: false,
    dashboard: false,
    inventory: false
  })

  const setLoadingState = useCallback((
    updater: (prev: LoadingState) => LoadingState
  ) => {
    setLoadingStateInternal(updater)
  }, [])

  const { fetchData, fetchWithCache } = useFetchWithCache()

  const buildUrl = (basePath: string, vendorId?: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const buildCacheKey = (key: string, vendorId?: string) => (vendorId ? `${key}:${vendorId}` : key)

  const fetchSales = async (vendorId?: string): Promise<Sale[]> => {
    const url = buildUrl('/api/erp/sales', vendorId)
    const cacheKey = buildCacheKey('sales', vendorId)
    const data = await fetchData<SalesData>('sales', url, cacheKey, (data) => {
      const sales = Array.isArray(data.sales) ? data.sales : []
      return {
        sales: sales.map((sale) => ({
          ...sale,
          paymentMethod: (sale.paymentMethod || 'cash').toString().toLowerCase()
        }))
      }
    })
    return data?.sales || []
  }

  const fetchCustomers = async (vendorId?: string): Promise<Customer[]> => {
    const url = buildUrl('/api/erp/customers', vendorId)
    const cacheKey = buildCacheKey('customers', vendorId)
    const data = await fetchData<CustomersData>(
      'customers',
      url,
      cacheKey,
      (data) => ({
        customers: Array.isArray(data.customers) ? data.customers : []
      })
    )
    return data?.customers || []
  }

  const fetchSuppliers = async (vendorId?: string): Promise<Supplier[]> => {
    const url = buildUrl('/api/erp/suppliers', vendorId)
    const cacheKey = buildCacheKey('suppliers', vendorId)
    const data = await fetchData<SuppliersData>(
      'suppliers',
      url,
      cacheKey,
      (data) => ({
        suppliers: Array.isArray(data.suppliers) ? data.suppliers : []
      })
    )
    return data?.suppliers || []
  }

  const fetchProducts = async (vendorId?: string): Promise<InventoryProduct[]> => {
    const url = buildUrl('/api/erp/inventory', vendorId)
    const cacheKey = buildCacheKey('products', vendorId)
    const data = await fetchData<ProductsData>(
      'products',
      url,
      cacheKey,
      (data) => ({
        products: Array.isArray(data.products) ? data.products : []
      })
    )
    return data?.products || []
  }

  const fetchOrders = async (vendorId?: string): Promise<Order[]> => {
    const url = buildUrl('/api/vendors/orders', vendorId)
    const cacheKey = buildCacheKey('orders', vendorId)
    const data = await fetchData<OrdersData>(
      'orders',
      url,
      cacheKey,
      (data) => ({
        orders: Array.isArray(data.orders) ? data.orders : []
      })
    )
    return data?.orders || []
  }

  const fetchCategories = async (vendorId?: string): Promise<Category[]> => {
    const url = buildUrl('/api/erp/categories', vendorId)
    const cacheKey = buildCacheKey('categories', vendorId)
    const data = await fetchData<CategoriesData>(
      'categories',
      url,
      cacheKey,
      (data) => ({
        categories: Array.isArray(data.categories) ? data.categories : []
      })
    )
    return data?.categories || []
  }

  return {
    loadingState,
    setLoadingState,
    fetchWithCache,
    fetchSales,
    fetchCustomers,
    fetchSuppliers,
    fetchProducts,
    fetchOrders,
    fetchCategories
  }
}