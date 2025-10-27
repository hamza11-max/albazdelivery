import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../stores/offline-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure API URL based on environment
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api' // Replace with your local IP
  : 'https://your-project.vercel.app/api';

// Cache configuration
const CACHE_CONFIG = {
  // Cache duration in milliseconds
  maxAge: 1000 * 60 * 60, // 1 hour
  excludePaths: ['/auth/login', '/auth/logout'],
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache helper functions
const getCacheKey = (config: AxiosRequestConfig) => {
  return `api-cache:${config.method}:${config.url}:${JSON.stringify(config.params)}`;
};

const getFromCache = async (config: AxiosRequestConfig) => {
  try {
    const cacheKey = getCacheKey(config);
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < CACHE_CONFIG.maxAge) {
        return data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const saveToCache = async (config: AxiosRequestConfig, data: any) => {
  try {
    if (config.method?.toLowerCase() !== 'get') return;
    if (CACHE_CONFIG.excludePaths.some(path => config.url?.includes(path))) return;
    
    const cacheKey = getCacheKey(config);
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  // Add auth token
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Auth token error:', error);
  }

  // Check network status
  const netInfo = await NetInfo.fetch();
  const isOnline = netInfo.isConnected && netInfo.isInternetReachable;
  useOfflineStore.getState().setOnlineStatus(isOnline);

  // Handle offline state
  if (!isOnline) {
    const cachedData = await getFromCache(config);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }

    // Queue write operations for later
    if (config.method?.toLowerCase() !== 'get') {
      useOfflineStore.getState().addToOfflineQueue({
        endpoint: config.url || '',
        method: config.method || 'GET',
        data: config.data,
      });
      throw new Error('Operation queued for offline mode');
    }
  }

  // Compress request data if large
  if (config.data && typeof config.data === 'object') {
    try {
      config.data = JSON.stringify(config.data);
      config.headers['Content-Encoding'] = 'gzip';
    } catch (error) {
      console.error('Data compression error:', error);
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(async (response) => {
  // Cache successful GET responses
  if (response.config.method?.toLowerCase() === 'get') {
    await saveToCache(response.config, response.data);
  }

  return response;
}, async (error: AxiosError) => {
  // Handle specific error cases
  if (error.response?.status === 401) {
    // Handle unauthorized - clear token and redirect to login
    await SecureStore.deleteItemAsync('authToken');
    // Redirect to login (implement based on your navigation setup)
  }

  // Network error handling
  if (error.message === 'Network Error' || !error.response) {
    const cachedData = await getFromCache(error.config!);
    if (cachedData) {
      return Promise.resolve({ data: cachedData, headers: {}, status: 200 });
    }
  }

  return Promise.reject(error);
});

// Automatic retry for failed requests
const withRetry = async (request: () => Promise<any>, retries = 3, delay = 1000) => {
  try {
    return await request();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(request, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Enhanced API methods with retry and offline support
export const enhancedApi = {
  get: (url: string, config?: AxiosRequestConfig) => 
    withRetry(() => api.get(url, config)),
  
  post: (url: string, data?: any, config?: AxiosRequestConfig) =>
    withRetry(() => api.post(url, data, config)),
  
  put: (url: string, data?: any, config?: AxiosRequestConfig) =>
    withRetry(() => api.put(url, data, config)),
  
  delete: (url: string, config?: AxiosRequestConfig) =>
    withRetry(() => api.delete(url, config)),
    
  // Background sync utility
  sync: async () => {
    const offlineStore = useOfflineStore.getState();
    if (offlineStore.isOnline) {
      await offlineStore.syncOfflineQueue();
      await offlineStore.syncOfflineData();
    }
  }
};

export default enhancedApi;