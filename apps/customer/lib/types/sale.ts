export interface Sale {
  id: string
  customerId?: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: "cash" | "card"
  createdAt: Date
}

export interface SaleItem {
  productId: number
  productName: string
  quantity: number
  price: number
  discount: number
}

export interface SalesData {
  sales: Sale[]
  total: number
  page: number
  limit: number
}