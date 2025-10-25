// Core entity types
export * from './category'
export * from './customer'
export * from './product'
export * from './sale'
export * from './supplier'
export * from './order'

// API types
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