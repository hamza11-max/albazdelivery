import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base URL - Update this to match your backend
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api' // Development
  : 'https://your-production-api.com/api'; // Production

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await SecureStore.setItemAsync('auth_token', response.data.token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
  },
  getCurrentUser: async () => {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;
  },
};

// ERP API
export const erpAPI = {
  // Dashboard
  getDashboard: async (vendorId?: string) => {
    const url = vendorId ? `/erp/dashboard?vendorId=${vendorId}` : '/erp/dashboard';
    return api.get(url).then(res => res.data);
  },

  // Inventory
  getInventory: async (vendorId?: string) => {
    const url = vendorId ? `/erp/inventory?vendorId=${vendorId}` : '/erp/inventory';
    return api.get(url).then(res => res.data);
  },
  createProduct: async (product: any, vendorId?: string) => {
    const url = vendorId ? `/erp/inventory?vendorId=${vendorId}` : '/erp/inventory';
    return api.post(url, product).then(res => res.data);
  },
  updateProduct: async (id: number, product: any, vendorId?: string) => {
    const url = vendorId ? `/erp/inventory?id=${id}&vendorId=${vendorId}` : `/erp/inventory?id=${id}`;
    return api.put(url, product).then(res => res.data);
  },
  deleteProduct: async (id: number, vendorId?: string) => {
    const url = vendorId ? `/erp/inventory?id=${id}&vendorId=${vendorId}` : `/erp/inventory?id=${id}`;
    return api.delete(url).then(res => res.data);
  },

  // Sales
  getSales: async (vendorId?: string) => {
    const url = vendorId ? `/erp/sales?vendorId=${vendorId}` : '/erp/sales';
    return api.get(url).then(res => res.data);
  },
  createSale: async (sale: any, vendorId?: string) => {
    const url = vendorId ? `/erp/sales?vendorId=${vendorId}` : '/erp/sales';
    return api.post(url, sale).then(res => res.data);
  },

  // Customers
  getCustomers: async (vendorId?: string) => {
    const url = vendorId ? `/erp/customers?vendorId=${vendorId}` : '/erp/customers';
    return api.get(url).then(res => res.data);
  },
  createCustomer: async (customer: any, vendorId?: string) => {
    const url = vendorId ? `/erp/customers?vendorId=${vendorId}` : '/erp/customers';
    return api.post(url, customer).then(res => res.data);
  },

  // Suppliers
  getSuppliers: async (vendorId?: string) => {
    const url = vendorId ? `/erp/suppliers?vendorId=${vendorId}` : '/erp/suppliers';
    return api.get(url).then(res => res.data);
  },
  createSupplier: async (supplier: any, vendorId?: string) => {
    const url = vendorId ? `/erp/suppliers?vendorId=${vendorId}` : '/erp/suppliers';
    return api.post(url, supplier).then(res => res.data);
  },

  // AI Insights
  getAIInsights: async (vendorId?: string) => {
    const url = vendorId ? `/erp/ai-insights?vendorId=${vendorId}` : '/erp/ai-insights';
    return api.get(url).then(res => res.data);
  },
};

export default api;

