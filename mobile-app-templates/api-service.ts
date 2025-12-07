// API Service Template
// Copy to: mobile-apps/[app-name]/services/api.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configure API URL
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api' // Replace with your local IP
  : 'https://your-project.vercel.app/api'; // Production URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      await SecureStore.deleteItemAsync('authToken');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;

// API Functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const ordersAPI = {
  getOrders: async (status?: string) => {
    const response = await api.get('/orders', {
      params: { status },
    });
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
};

export const restaurantsAPI = {
  getRestaurants: async (filters?: any) => {
    const response = await api.get('/restaurants', { params: filters });
    return response.data;
  },
  
  getRestaurantById: async (id: string) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },
};

export const driversAPI = {
  updateLocation: async (latitude: number, longitude: number) => {
    const response = await api.post('/drivers/location', {
      latitude,
      longitude,
    });
    return response.data;
  },
  
  getAvailableOrders: async () => {
    const response = await api.get('/drivers/available-orders');
    return response.data;
  },
  
  acceptOrder: async (orderId: string) => {
    const response = await api.post(`/drivers/orders/${orderId}/accept`);
    return response.data;
  },
};
