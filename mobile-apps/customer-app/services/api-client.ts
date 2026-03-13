/**
 * API Client - mirrors apps/customer lib/api-client.ts
 * Calls the same backend endpoints as the web app
 */

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: unknown; error?: { message?: string; details?: unknown[] } }> {
  const url = `${API_BASE_URL}${path}`;
  const token = await SecureStore.getItemAsync('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new APIError(
      data.error?.message || 'An error occurred',
      response.status,
      data.error
    );
  }
  return data;
}

// Categories
export const categoriesAPI = {
  async list() {
    return fetchAPI('/api/categories');
  },
  async getById(id: number) {
    return fetchAPI(`/api/categories/${id}`);
  },
};

// Stores
export const storesAPI = {
  async list(params?: { categoryId?: number; city?: string; search?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.categoryId) sp.set('categoryId', String(params.categoryId));
    if (params?.city) sp.set('city', params.city);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const q = sp.toString();
    return fetchAPI(`/api/stores${q ? `?${q}` : ''}`);
  },
  async getById(id: string) {
    return fetchAPI(`/api/stores/${id}`);
  },
};

// Products
export const productsAPI = {
  async list(params: { storeId: string; search?: string; available?: boolean }) {
    const sp = new URLSearchParams();
    sp.set('storeId', params.storeId);
    if (params?.search) sp.set('search', params.search);
    if (params?.available !== undefined) sp.set('available', String(params.available));
    return fetchAPI(`/api/products?${sp.toString()}`);
  },
};

// Orders
export const ordersAPI = {
  async list(params?: { status?: string; page?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.page) sp.set('page', String(params.page));
    const q = sp.toString();
    return fetchAPI(`/api/orders${q ? `?${q}` : ''}`);
  },
  async getById(id: string) {
    return fetchAPI(`/api/orders/${id}`);
  },
  async getTrack(orderId: string) {
    return fetchAPI(`/api/orders/track?orderId=${encodeURIComponent(orderId)}`);
  },
  async create(orderData: {
    storeId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: string;
    deliveryAddress: string;
    city: string;
    customerPhone: string;
    promoCode?: string;
    discount?: number;
  }) {
    return fetchAPI('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  async updateStatus(id: string, status: string, driverId?: string) {
    return fetchAPI(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, driverId }),
    });
  },
};

// Delivery fee
export const deliveryAPI = {
  async getFee(city: string) {
    return fetchAPI(`/api/delivery/fee?city=${encodeURIComponent(city)}`);
  },
};

// Addresses
export const addressesAPI = {
  async list() {
    return fetchAPI('/api/addresses');
  },
  async create(data: { label?: string; address: string; city: string; isDefault?: boolean }) {
    return fetchAPI('/api/addresses', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: Partial<{ label: string; address: string; city: string; isDefault: boolean }>) {
    return fetchAPI(`/api/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string) {
    return fetchAPI(`/api/addresses/${id}`, { method: 'DELETE' });
  },
};

// Wallet
export const walletAPI = {
  async getBalance() {
    return fetchAPI('/api/wallet/balance');
  },
  async getTransactions(customerId?: string) {
    const q = customerId ? `?customerId=${customerId}` : '';
    return fetchAPI(`/api/wallet/transactions${q}`);
  },
  async addFunds(amount: number, customerId?: string) {
    return fetchAPI('/api/wallet/balance', {
      method: 'POST',
      body: JSON.stringify({ customerId, amount, description: 'Recharge de portefeuille' }),
    });
  },
};

// Promo (POST body to match web/backend)
export const promoAPI = {
  async validate(code: string, subtotal: number) {
    return fetchAPI('/api/promo/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    });
  },
};

// Package delivery
export const packageDeliveryAPI = {
  async create(packageData: {
    packageDescription: string;
    recipientName: string;
    recipientPhone: string;
    deliveryAddress: string;
    city: string;
    customerPhone: string;
    deliveryFee: number;
    paymentMethod: string;
    whoPays?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }) {
    return fetchAPI('/api/package-delivery/create', {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
  },
};

// Notifications
export const notificationsAPI = {
  async list(params?: { page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.limit != null) sp.set('limit', String(params.limit));
    const q = sp.toString();
    return fetchAPI(`/api/notifications${q ? `?${q}` : ''}`);
  },
  async markAsRead(notificationIds: string[]) {
    return fetchAPI('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationIds }),
    });
  },
  async markAllAsRead() {
    return fetchAPI('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ markAll: true }),
    });
  },
  async delete(notificationIds: string[]) {
    return fetchAPI('/api/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ notificationIds }),
    });
  },
};

// Loyalty
export const loyaltyAPI = {
  async getAccount(customerId?: string) {
    const q = customerId ? `?customerId=${customerId}` : '';
    return fetchAPI(`/api/loyalty/account${q}`);
  },
  async getRewards() {
    return fetchAPI('/api/loyalty/rewards');
  },
  async redeemReward(customerId: string, rewardId: string, pointsCost: number) {
    return fetchAPI('/api/loyalty/rewards', {
      method: 'POST',
      body: JSON.stringify({ customerId, rewardId, pointsCost }),
    });
  },
  async getTransactions(customerId?: string) {
    const q = customerId ? `?customerId=${customerId}` : '';
    return fetchAPI(`/api/loyalty/transactions${q}`);
  },
};

// Reviews / ratings
export const reviewsAPI = {
  async list(vendorId?: string, productId?: string) {
    const sp = new URLSearchParams();
    if (vendorId) sp.set('vendorId', vendorId);
    if (productId) sp.set('productId', productId);
    return fetchAPI(`/api/ratings/reviews?${sp.toString()}`);
  },
  async create(data: { orderId: string; rating: number; comment: string; foodQuality?: number; deliveryTime?: number; customerService?: number }) {
    return fetchAPI('/api/ratings/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async markHelpful(reviewId: string, helpful: boolean) {
    return fetchAPI('/api/ratings/reviews/helpful', {
      method: 'POST',
      body: JSON.stringify({ reviewId, helpful }),
    });
  },
  async addResponse(reviewId: string, response: string) {
    return fetchAPI('/api/ratings/reviews/response', {
      method: 'POST',
      body: JSON.stringify({ reviewId, response }),
    });
  },
};

// Payments
export const paymentsAPI = {
  async create(data: { orderId: string; amount: number; method: string; transactionId?: string }) {
    return fetchAPI('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async createIntent(data: { amount: number; orderId?: string }) {
    return fetchAPI('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async getHistory(customerId?: string) {
    const q = customerId ? `?customerId=${customerId}` : '';
    return fetchAPI(`/api/payments/history${q}`);
  },
};

// Support
export const supportAPI = {
  async getTicket(ticketId: string) {
    return fetchAPI(`/api/support/tickets/${ticketId}`);
  },
  async updateTicket(ticketId: string, data: { status?: string; assignedTo?: string }) {
    return fetchAPI(`/api/support/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
