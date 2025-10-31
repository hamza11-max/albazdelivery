import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from './stores/offline-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  EnhancedRequestConfig,
  EnhancedResponse,
  RetryConfig,
  CacheConfig
} from './types';

// Configure API URL based on environment
const API_URL = __DEV__
  ? 'http://192.168.1.100:3000/api' // Replace with your local IP
  : 'https://your-project.vercel.app/api';

// Cache configuration
const CACHE_CONFIG: CacheConfig = {
  maxAge: 1000 * 60 * 60, // 1 hour
  excludePaths: ['/auth/login', '/auth/logout'],
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache helper functions
const getCacheKey = (config: EnhancedRequestConfig): string => {
  return `api-cache:${config.method}:${config.url}:${JSON.stringify(config.params)}`;
};

const getFromCache = async <T>(config: EnhancedRequestConfig): Promise<EnhancedResponse<T> | null> => {
  try {
    const cacheKey = getCacheKey(config);
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CACHE_CONFIG.maxAge) {
        return data as EnhancedResponse<T>;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const saveToCache = async <T>(config: EnhancedRequestConfig, data: T): Promise<void> => {
  try {
    if (config.method?.toLowerCase() !== 'get') return;
    if (CACHE_CONFIG.excludePaths?.some((path: string) => config.url?.includes(path))) return;

    const cacheKey = getCacheKey(config);
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Request interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Add auth token
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      if (!config.headers) config.headers = {} as AxiosRequestHeaders;
      (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Auth token error:', error);
  }

  // Check network status
  const netInfo = await NetInfo.fetch();
  const isOnline = (netInfo.isConnected && netInfo.isInternetReachable) ?? false;
  useOfflineStore.getState().setOnlineStatus(Boolean(isOnline));

  // Handle offline state
  if (!isOnline) {
    const cachedData = await getFromCache(config as unknown as EnhancedRequestConfig);
    if (cachedData) {
      // Return a fake adapter that resolves with the cached response
      return {
        ...config,
        adapter: () => Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config
        })
      } as any;
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
    const cachedData = await getFromCache(error.config as unknown as EnhancedRequestConfig);
    if (cachedData) {
      return Promise.resolve({ data: cachedData, status: 200, statusText: 'OK (Cached)', headers: {}, config: error.config } as any);
    }
  }

  return Promise.reject(error);
});

// Automatic retry for failed requests
const withRetry = async <T>(
  request: () => Promise<T>,
  retries = 3,
  delay = 1000,
  config: RetryConfig = {} as RetryConfig
): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (retries > 0) {
      config.onRetry?.(retries, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(request, retries - 1, delay * 2, config);
    }
    throw error;
  }
};

// Enhanced API methods with retry and offline support
export const enhancedApi = {
  get: <T>(url: string, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>> => 
    withRetry(() => api.get<T>(url, config)),
  
  post: <T>(url: string, data?: unknown, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>> =>
    withRetry(() => api.post<T>(url, data, config)),
    
  put: <T>(url: string, data?: unknown, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>> =>
    withRetry(() => api.put<T>(url, data, config)),
    
  delete: <T>(url: string, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>> =>
    withRetry(() => api.delete<T>(url, config)),
    
  patch: <T>(url: string, data?: unknown, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>> =>
    withRetry(() => api.patch<T>(url, data, config)),
    
  setAuthToken: (token: string): void => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  },
  
  clearAuthToken: (): void => {
    delete api.defaults.headers.common.Authorization;
  },
  
  getCacheKey,
  
  clearCache: async (): Promise<void> => {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('api-cache:'));
    await AsyncStorage.multiRemove(cacheKeys);
  },
  
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