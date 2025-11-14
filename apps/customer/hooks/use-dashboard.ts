import type {
  Sale,
  Customer,
  Supplier,
  Product,
  Order,
} from '@/lib/types'
import type { Category } from '@/lib/types/category'

export interface LoadingState {
  [key: string]: boolean
  sales: boolean
  customers: boolean
  suppliers: boolean
  products: boolean
  orders: boolean
  categories: boolean
  dashboard: boolean
}

export interface DashboardData {
  loadingState: LoadingState
  setLoadingState: (updater: (prev: LoadingState) => LoadingState) => void
  fetchWithCache: <T>(key: string, url: string) => Promise<T>
  fetchSales: () => Promise<Sale[]>
  fetchCustomers: () => Promise<Customer[]>
  fetchSuppliers: () => Promise<Supplier[]>
  fetchProducts: () => Promise<Product[]>
  fetchOrders: () => Promise<Order[]>
  fetchCategories: () => Promise<Category[]>
}

export function useDashboardData(): DashboardData {
  // ... implementation will be added by the user
  throw new Error('Not implemented')
}