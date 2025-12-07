export interface Category {
  id: number
  name: string
  description?: string
  parentId?: number
  icon?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}