import type { Product } from './product'

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  total: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  customerId?: number
  notes?: string
}

export interface CartCreateInput {
  items: CartItem[]
  customerId?: number
  notes?: string
  discount: number
  paymentMethod: 'cash' | 'card'
}

export interface CartUpdateInput {
  items?: CartItem[]
  customerId?: number
  notes?: string
  discount?: number
}