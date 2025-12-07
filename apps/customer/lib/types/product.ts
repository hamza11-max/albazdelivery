export interface Product {
  id: number
  storeId: number
  name: string
  description: string
  price: number
  image: string
  rating: number
  available: boolean
}

// Product Form
export interface ProductForm {
  sku: string
  name: string
  category: string
  description: string
  supplierId: string
  costPrice: string
  sellingPrice: string
  price: string
  stock: number
  lowStockThreshold: number
  barcode: string
  image: string
}

// Inventory Product with full data
export interface InventoryProduct {
  id: number
  sku: string
  name: string
  category: string
  description?: string
  supplierId?: number
  costPrice: number
  sellingPrice: number
  price: number
  stock: number
  lowStockThreshold: number
  image?: string
  barcode?: string
  createdAt: Date
  updatedAt: Date
}