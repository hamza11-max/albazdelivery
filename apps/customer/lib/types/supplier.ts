export interface Supplier {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  products?: string[]
  createdAt: Date
  updatedAt: Date
}