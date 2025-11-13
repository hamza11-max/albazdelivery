import { 
  type Customer, 
  type Sale, 
  type SaleItem, 
  type InventoryProduct,
  type Order,
  type Supplier
} from "@/lib/types"
import { type Category } from "@/lib/types/category"

// Re-export types
export type { 
  Customer,
  Sale,
  SaleItem,
  InventoryProduct,
  Order,
  Supplier
}

export type { Category }

// Import API types from shared lib
export type { ApiResponse } from '@/lib/types'

export interface CartItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
  discount: number
}

export interface CustomerForm {
  name: string
  email: string
  phone: string
  address: string
}

export interface SalesForecast {
  week: number
  month: number
  trend: 'up' | 'down' | 'stable'
}

// BaseProductFields is defined in the Form Types section below
// Forward declaration for ProductUpdateData
export interface BaseProductFields {
  name: string
  description: string
  category: string
  stock: number
  lowStockThreshold: number
}

export interface ProductUpdateData extends BaseProductFields {
  id: number
  sku?: string
  supplierId?: string
  costPrice?: string
  sellingPrice?: string
  barcode?: string
  image?: string
}

export interface TopProductData {
  productId: number
  productName: string
  totalQuantity: number
  totalSales: number
  totalSold: number
}

export interface BundleRecommendation {
  products: string[]
  confidence: number
  support: number
  frequency: number
  suggestedDiscount: number
}

export interface InventoryRecommendation {
  productId: number
  productName: string
  currentStock: number
  recommendedStock: number
  reason: string
  recommendedQuantity: number
}

export interface SupplierForm {
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
}

// Data Transfer Objects
export interface SalesData {
  sales: Sale[]
  totalSales?: number
  periodSales?: { [key: string]: number }
}

export interface CustomersData {
  customers: Customer[]
  totalCustomers?: number
  recentCustomers?: Customer[]
}

export interface SuppliersData {
  suppliers: Supplier[]
  totalSuppliers?: number
  activeSuppliers?: number
}

export interface ProductsData {
  products: InventoryProduct[]
  totalProducts?: number
  lowStockProducts?: InventoryProduct[]
}

export interface OrdersData {
  orders: Order[]
  totalOrders?: number
  pendingOrders?: number
}

export interface CategoriesData {
  categories: Category[]
  totalCategories?: number
  popularCategories?: { id: number; name: string; count: number }[]
}

// UI State Types
export interface LoadingState {
  sales: boolean
  customers: boolean
  suppliers: boolean
  products: boolean
  orders: boolean
  categories: boolean
  dashboard: boolean
  inventory: boolean
}

// Form Types (consolidated - duplicates removed)
// BaseProductFields is defined above for ProductUpdateData

export interface ProductForm extends BaseProductFields {
  sku: string
  supplierId: string
  costPrice: string
  sellingPrice: string
  barcode: string
  image: string
  price: string
}

// Filter Types
export interface SalesFilter {
  startDate: string
  endDate: string
  paymentMethod: string
}

// Dashboard Types
export interface TopProduct {
  productId: number
  name: string
  totalQuantity: number
  totalSales: number
}

export interface DashboardData {
  todaySales: number
  weekSales: number
  monthSales: number
  topProducts: TopProduct[]
  lowStockProducts: InventoryProduct[]
}

// AI Types
export interface AIInsights {
  salesForecast: {
    week: number
    month: number
    trend: 'up' | 'down' | 'stable'
  }
  inventoryRecommendations: Array<{
    productId: number
    name: string
    currentStock: number
    recommendedOrder: number
  }>
  productBundles: Array<{
    products: Array<{
      productId: number
      name: string
    }>
    totalValue: number
    discountSuggestion: number
  }>
}