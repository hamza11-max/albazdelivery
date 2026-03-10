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
};

// Wallet
export const walletAPI = {
  async getBalance() {
    return fetchAPI('/api/wallet/balance');
  },
};

// Promo
export const promoAPI = {
  async validate(code: string, subtotal: number) {
    return fetchAPI(`/api/promo/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
  },
};
