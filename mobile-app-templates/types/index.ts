import { AxiosRequestConfig } from 'axios';

export interface ApiConfig extends AxiosRequestConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface CacheConfig {
  maxAge: number;
  excludePaths: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
}

export interface OfflineState {
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  offlineData: Record<string, any>;
  lastSyncTimestamp: number | null;
}