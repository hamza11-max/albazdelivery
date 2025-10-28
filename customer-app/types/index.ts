// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Offline Store Types
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

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// API Config Types
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// Cache Types
export interface CacheConfig {
  maxAge: number;
  excludePaths: string[];
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}