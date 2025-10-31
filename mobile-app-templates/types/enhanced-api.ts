import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface EnhancedRequestConfig extends AxiosRequestConfig {
  bypassCache?: boolean;
  forceOffline?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export interface EnhancedResponse<T = any> extends AxiosResponse<T> {
  fromCache?: boolean;
  timestamp?: number;
}

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (retryCount: number, error: any) => void;
}

export interface CacheConfig {
  maxAge: number;
  excludePaths: string[];
}

export interface EnhancedApiService {
  request<T = any>(config: EnhancedRequestConfig): Promise<EnhancedResponse<T>>;
  get<T = any>(url: string, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>>;
  post<T = any>(url: string, data?: any, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>>;
  put<T = any>(url: string, data?: any, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>>;
  delete<T = any>(url: string, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: EnhancedRequestConfig): Promise<EnhancedResponse<T>>;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
  getCacheKey(config: EnhancedRequestConfig): string;
  clearCache(): Promise<void>;
}