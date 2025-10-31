import { AxiosRequestConfig, AxiosResponse, AxiosRequestHeaders } from 'axios';

// API configuration
export interface ApiConfig extends AxiosRequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string> | AxiosRequestHeaders;
}

// Cache configuration
export interface CacheConfig {
  maxAge: number;
  excludePaths?: string[];
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

// Simple API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

// Enhanced axios types
export interface EnhancedResponse<T = any> extends AxiosResponse<T> {
  fromCache?: boolean;
  timestamp?: number;
}

export interface EnhancedRequestConfig extends AxiosRequestConfig {
  cache?: boolean;
  cacheKey?: string;
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  retries: number;
  retryCondition?: (error: any) => boolean;
  retryDelay?: number;
  shouldResetTimeout?: boolean;
  onRetry?: (remainingRetries: number, error: any) => void;
}

// Queue related types
export interface QueuedRequest {
  id: string;
  config: AxiosRequestConfig;
  timestamp: number;
}

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: string;
  data: unknown;
  timestamp: number;
}

// BaseOfflineState is a small portable shape some modules expect
export interface BaseOfflineState {
  queuedRequests: QueuedRequest[];
  addToQueue: (request: QueuedRequest) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

// Store-specific OfflineState used by the zustand store
export interface OfflineState {
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  offlineData: Record<string, unknown>;
  lastSyncTimestamp: number | null;

  // Actions
  setOnlineStatus: (status: boolean) => void;
  addToOfflineQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => void;
  removeFromOfflineQueue: (id: string) => void;
  setOfflineData: <T = unknown>(key: string, data: T) => void;
  getOfflineData: <T = unknown>(key: string) => T | undefined;
  setLastSyncTimestamp: (timestamp: number) => void;

  // Sync operations
  syncOfflineQueue: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
}