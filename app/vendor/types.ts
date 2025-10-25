import { 
  type Customer, 
  type Sale, 
  type SaleItem, 
  type InventoryProduct,
  type Order,
  type Supplier,
  type Category
} from "@/lib/types"

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

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

export interface ProductForm {
  sku: string
  name: string
  category: string
  supplierId: string
  costPrice: string
  sellingPrice: string
  stock: string
  lowStockThreshold: string
  barcode: string
  image: string
}

export interface CustomerForm {
  name: string
  email: string
  phone: string
  address: string
}

export interface SupplierForm {
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
}

export interface SalesFilter {
  startDate: string
  endDate: string
  paymentMethod: string
}

export interface DashboardData {
  todaySales: number
  weekSales: number
  monthSales: number
  topProducts: Array<{
    productId: number
    name: string
    totalQuantity: number
    totalSales: number
  }>
  lowStockProducts: InventoryProduct[]
}

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