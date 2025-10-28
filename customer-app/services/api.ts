import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiConfig, CacheConfig, CacheEntry, ApiResponse } from '../types';
import { useOfflineStore } from '../stores/offline-store';

const API_CONFIG: ApiConfig = {
  baseURL: __DEV__ 
    ? 'http://192.168.1.100:3000/api'
    : 'https://your-project.vercel.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const CACHE_CONFIG: CacheConfig = {
  maxAge: 1000 * 60 * 60, // 1 hour
  excludePaths: ['/auth/login', '/auth/logout'],
};

const api = axios.create(API_CONFIG);

const getCacheKey = (config: AxiosRequestConfig): string => {
  return `api-cache:${config.method}:${config.url}:${JSON.stringify(config.params)}`;
};

const getFromCache = async <T>(config: AxiosRequestConfig): Promise<T | null> => {
  try {
    const cacheKey = getCacheKey(config);
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached) as CacheEntry<T>;
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

const saveToCache = async <T>(config: AxiosRequestConfig, data: T): Promise<void> => {
  try {
    if (config.method?.toLowerCase() !== 'get') return;
    if (CACHE_CONFIG.excludePaths.some(path => config.url?.includes(path))) return;
    
    const cacheKey = getCacheKey(config);
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    const netInfo = await NetInfo.fetch();
    const isOnline = (netInfo.isConnected && netInfo.isInternetReachable) ?? false;
    useOfflineStore.getState().setOnlineStatus(isOnline);

    if (!isOnline) {
      const cachedData = await getFromCache(config);
      if (cachedData) {
        return {
          ...config,
          adapter: () => Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config
          })
        };
      }

      if (config.method?.toLowerCase() !== 'get') {
        useOfflineStore.getState().addToOfflineQueue({
          endpoint: config.url || '',
          method: config.method || 'GET',
          data: config.data,
        });
        throw new Error('Operation queued for offline mode');
      }
    }

    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

// Response interceptor
api.interceptors.response.use(
  async (response) => {
    if (response.config.method?.toLowerCase() === 'get') {
      await saveToCache(response.config, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
    }

    if (error.message === 'Network Error' || !error.response) {
      const cachedData = await getFromCache(error.config!);
      if (cachedData) {
        return {
          data: cachedData,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config: error.config,
        } as AxiosResponse;
      }
    }

    return Promise.reject(error);
  }
);

const withRetry = async <T>(
  request: () => Promise<AxiosResponse<T>>,
  retries = 3,
  delay = 1000
): Promise<AxiosResponse<T>> => {
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

export const enhancedApi = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    withRetry<ApiResponse<T>>(() => api.get(url, config)),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    withRetry<ApiResponse<T>>(() => api.post(url, data, config)),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    withRetry<ApiResponse<T>>(() => api.put(url, data, config)),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    withRetry<ApiResponse<T>>(() => api.delete(url, config)),
  
  request: <T>(config: AxiosRequestConfig) =>
    withRetry<ApiResponse<T>>(() => api.request(config)),
    
  sync: async () => {
    const offlineStore = useOfflineStore.getState();
    if (offlineStore.isOnline) {
      await offlineStore.syncOfflineQueue();
      await offlineStore.syncOfflineData();
    }
  }
};

export default enhancedApi;