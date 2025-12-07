/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

/**
 * Query result with metadata 
 */
export interface QueryResult<T> {
  data: T[]
  total: number
  page: number 
  limit: number
}