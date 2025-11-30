/**
 * API Client for Frontend
 * Centralized API calls with error handling, retry logic, and type safety
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryableStatusCodes?: number[]
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Enhanced fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      // If successful or non-retryable error, return immediately
      if (response.ok || !config.retryableStatusCodes.includes(response.status)) {
        return response
      }

      // If retryable error and not last attempt, wait and retry
      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, attempt) // Exponential backoff
        await sleep(delay)
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If not last attempt, wait and retry
      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}

/**
 * Enhanced fetchAPI with retry logic
 */
async function fetchAPI(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
) {
  const response = await fetchWithRetry(url, options, retryOptions)
  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new APIError(
      data.error?.message || 'An error occurred',
      response.status,
      data.error
    )
  }

  return data
}

// ============================================
// ORDERS API
// ============================================

export const ordersAPI = {
  async list(params?: { status?: string; page?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    
    const query = searchParams.toString()
    return fetchAPI(`/api/orders${query ? `?${query}` : ''}`)
  },

  async getById(id: string) {
    return fetchAPI(`/api/orders/${id}`)
  },

  async create(orderData: {
    storeId: string
    items: Array<{ productId: string; quantity: number; price: number }>
    subtotal: number
    deliveryFee: number
    total: number
    paymentMethod: string
    deliveryAddress: string
    city: string
    customerPhone: string
  }) {
    return fetchAPI('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  },

  async updateStatus(id: string, status: string, driverId?: string) {
    return fetchAPI(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, driverId }),
    })
  },
}

// ============================================
// PRODUCTS API
// ============================================

export const productsAPI = {
  async list(params?: { storeId?: string; search?: string; available?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.storeId) searchParams.set('storeId', params.storeId)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.available !== undefined) searchParams.set('available', params.available.toString())
    
    const query = searchParams.toString()
    return fetchAPI(`/api/products${query ? `?${query}` : ''}`)
  },

  async update(productId: string, data: { available?: boolean }) {
    return fetchAPI(`/api/products`, {
      method: 'PATCH',
      body: JSON.stringify({ productId, ...data }),
    })
  },
}

// ============================================
// WALLET API
// ============================================

export const walletAPI = {
  async getBalance(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : ''
    return fetchAPI(`/api/wallet/balance${query}`)
  },

  async getTransactions(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : ''
    return fetchAPI(`/api/wallet/transactions${query}`)
  },

  async addFunds(amount: number, customerId?: string) {
    return fetchAPI('/api/wallet/balance', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        amount,
        description: 'Recharge de portefeuille',
      }),
    })
  },
}

// ============================================
// LOYALTY API
// ============================================

export const loyaltyAPI = {
  async getAccount(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : ''
    return fetchAPI(`/api/loyalty/account${query}`)
  },

  async getRewards() {
    return fetchAPI('/api/loyalty/rewards')
  },

  async redeemReward(customerId: string, rewardId: string, pointsCost: number) {
    return fetchAPI('/api/loyalty/rewards', {
      method: 'POST',
      body: JSON.stringify({ customerId, rewardId, pointsCost }),
    })
  },

  async getTransactions(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : ''
    return fetchAPI(`/api/loyalty/transactions${query}`)
  },
}

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationsAPI = {
  async list(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return fetchAPI(`/api/notifications${query ? `?${query}` : ''}`)
  },

  async markAsRead(notificationIds: string[]) {
    return fetchAPI('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationIds }),
    })
  },

  async markAllAsRead() {
    return fetchAPI('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ markAll: true }),
    })
  },

  async delete(notificationIds: string[]) {
    return fetchAPI('/api/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ notificationIds }),
    })
  },
}

// ============================================
// DRIVER API
// ============================================

export const driverAPI = {
  async getDeliveries(status?: string) {
    const query = status ? `?status=${status}` : ''
    return fetchAPI(`/api/drivers/deliveries${query}`)
  },

  async acceptDelivery(orderId: string) {
    return fetchAPI('/api/drivers/deliveries/accept', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    })
  },

  async updateDeliveryStatus(orderId: string, status: string) {
    return fetchAPI(`/api/drivers/deliveries/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  async updateLocation(location: {
    latitude: number
    longitude: number
    accuracy: number
    heading: number
    speed: number
    isActive?: boolean
    status?: string
    currentOrderId?: string
  }) {
    return fetchAPI('/api/driver/location', {
      method: 'POST',
      body: JSON.stringify(location),
    })
  },

  async getLocation(driverId?: string, orderId?: string) {
    const params = new URLSearchParams()
    if (driverId) params.set('driverId', driverId)
    if (orderId) params.set('orderId', orderId)
    
    return fetchAPI(`/api/driver/location?${params.toString()}`)
  },
}

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  async getUsers(params?: { role?: string; status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.role) searchParams.set('role', params.role)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return fetchAPI(`/api/admin/users${query ? `?${query}` : ''}`)
  },

  async getRegistrationRequests(params?: { status?: string; role?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.role) searchParams.set('role', params.role)
    
    const query = searchParams.toString()
    return fetchAPI(`/api/admin/registration-requests${query ? `?${query}` : ''}`)
  },

  async processRegistrationRequest(requestId: string, action: 'approve' | 'reject') {
    return fetchAPI('/api/admin/registration-requests', {
      method: 'POST',
      body: JSON.stringify({ requestId, action }),
    })
  },
}

// ============================================
// REVIEWS API
// ============================================

export const reviewsAPI = {
  async list(vendorId?: string, productId?: string) {
    const params = new URLSearchParams()
    if (vendorId) params.set('vendorId', vendorId)
    if (productId) params.set('productId', productId)
    
    return fetchAPI(`/api/ratings/reviews?${params.toString()}`)
  },

  async create(reviewData: {
    orderId: string
    rating: number
    comment: string
    foodQuality?: number
    deliveryTime?: number
    customerService?: number
  }) {
    return fetchAPI('/api/ratings/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
  },

  async markHelpful(reviewId: string, helpful: boolean) {
    return fetchAPI('/api/ratings/reviews/helpful', {
      method: 'POST',
      body: JSON.stringify({ reviewId, helpful }),
    })
  },

  async addResponse(reviewId: string, response: string) {
    return fetchAPI('/api/ratings/reviews/response', {
      method: 'POST',
      body: JSON.stringify({ reviewId, response }),
    })
  },
}

// ============================================
// PAYMENTS API
// ============================================

export const paymentsAPI = {
  async create(paymentData: {
    orderId: string
    amount: number
    method: string
    transactionId?: string
  }) {
    return fetchAPI('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  },

  async getHistory(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : ''
    return fetchAPI(`/api/payments/history${query}`)
  },
}

// ============================================
// PACKAGE DELIVERY API
// ============================================

export const packageDeliveryAPI = {
  async create(packageData: {
    packageDescription: string
    recipientName: string
    recipientPhone: string
    deliveryAddress: string
    city: string
    customerPhone: string
    deliveryFee: number
    paymentMethod: string
    scheduledDate?: string
    scheduledTime?: string
    whoPays?: string
  }) {
    return fetchAPI('/api/package-delivery/create', {
      method: 'POST',
      body: JSON.stringify(packageData),
    })
  },
}

// ============================================
// SUPPORT API
// ============================================

export const supportAPI = {
  async getTicket(ticketId: string) {
    return fetchAPI(`/api/support/tickets/${ticketId}`)
  },

  async updateTicket(ticketId: string, data: { status?: string; assignedTo?: string }) {
    return fetchAPI(`/api/support/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// ============================================
// STORES API
// ============================================

export const storesAPI = {
  async list(params?: { categoryId?: number; city?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId.toString())
    if (params?.city) searchParams.set('city', params.city)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return fetchAPI(`/api/stores${query ? `?${query}` : ''}`, undefined, { maxRetries: 2 })
  },

  async getById(id: string) {
    return fetchAPI(`/api/stores/${id}`, undefined, { maxRetries: 2 })
  },
}

// ============================================
// CATEGORIES API
// ============================================

export const categoriesAPI = {
  async list() {
    return fetchAPI('/api/categories', undefined, { maxRetries: 2 })
  },

  async getById(id: number) {
    return fetchAPI(`/api/categories/${id}`, undefined, { maxRetries: 2 })
  },
}
