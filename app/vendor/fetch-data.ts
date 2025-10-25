import { useState, useCallback } from 'react'
import { useFetchWithCache } from "@/hooks/use-fetch-with-cache"
import type {
  ApiResponse,
  Sale,
  Customer,
  Supplier,
  InventoryProduct,
  Order,
  Category
} from "@/lib/types"
import type {
  SalesData,
  CustomersData,
  SuppliersData,
  ProductsData,
  OrdersData,
  CategoriesData,
  LoadingState
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

  const fetchSales = async (): Promise<Sale[]> => {
    const data = await fetchData<SalesData>('sales', '/api/erp/sales', 'sales', (data) => {
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

  const fetchCustomers = async (): Promise<Customer[]> => {
    const data = await fetchData<CustomersData>(
      'customers',
      '/api/erp/customers',
      'customers',
      (data) => ({
        customers: Array.isArray(data.customers) ? data.customers : []
      })
    )
    return data?.customers || []
  }

  const fetchSuppliers = async (): Promise<Supplier[]> => {
    const data = await fetchData<SuppliersData>(
      'suppliers',
      '/api/erp/suppliers',
      'suppliers',
      (data) => ({
        suppliers: Array.isArray(data.suppliers) ? data.suppliers : []
      })
    )
    return data?.suppliers || []
  }

  const fetchProducts = async (): Promise<InventoryProduct[]> => {
    const data = await fetchData<ProductsData>(
      'products',
      '/api/erp/products',
      'products',
      (data) => ({
        products: Array.isArray(data.products) ? data.products : []
      })
    )
    return data?.products || []
  }

  const fetchOrders = async (): Promise<Order[]> => {
    const data = await fetchData<OrdersData>(
      'orders',
      '/api/erp/orders',
      'orders',
      (data) => ({
        orders: Array.isArray(data.orders) ? data.orders : []
      })
    )
    return data?.orders || []
  }

  const fetchCategories = async (): Promise<Category[]> => {
    const data = await fetchData<CategoriesData>(
      'categories',
      '/api/erp/categories',
      'categories',
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