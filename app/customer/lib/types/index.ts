// Core types
export * from './api'

// Entity types
export * from './customer'
export * from './order'
export * from './product'
export * from './sale'
export * from './category'

// Common types
export type UserRole = "customer" | "vendor" | "driver" | "admin"
export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "assigned" | "in_delivery" | "delivered" | "cancelled"
export type PaymentMethod = "cash" | "card" | "wallet"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

// Common types
export type ID = number | string
export type Timestamp = string | number

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type LoadingState = {
  [key: string]: boolean
}