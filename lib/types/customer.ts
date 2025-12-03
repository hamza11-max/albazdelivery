import type { Order } from './order'

export interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  totalPurchases: number
  lastPurchaseDate?: Date
  createdAt: Date
  orders?: Order[]
}

export interface CustomerForm {
  name: string
  email: string
  phone: string
  address: string
}