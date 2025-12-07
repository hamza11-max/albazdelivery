"use client"

/**
 * Custom error classes for better error handling
 */
export class VendorAppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'VendorAppError'
    Object.setPrototypeOf(this, VendorAppError.prototype)
  }
}

export class NetworkError extends VendorAppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'NETWORK_ERROR', 0, originalError)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends VendorAppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class APIError extends VendorAppError {
  constructor(
    message: string,
    statusCode: number,
    public response?: any,
    originalError?: unknown
  ) {
    super(message, 'API_ERROR', statusCode, originalError)
    this.name = 'APIError'
  }
}

export class StorageError extends VendorAppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'STORAGE_ERROR', 0, originalError)
    this.name = 'StorageError'
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  translate?: (fr: string, ar: string) => string
  toast?: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  fallbackMessage?: { fr: string; ar: string }
}

/**
 * Centralized error handler
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): VendorAppError {
  const {
    showToast = true,
    logError = true,
    translate,
    toast,
    fallbackMessage = { fr: "Une erreur est survenue", ar: "حدث خطأ" }
  } = options

  let vendorError: VendorAppError

  // Convert unknown error to VendorAppError
  if (error instanceof VendorAppError) {
    vendorError = error
  } else if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      vendorError = new NetworkError(
        translate
          ? translate("Erreur de connexion", "خطأ في الاتصال")
          : "Network error",
        error
      )
    } else {
      vendorError = new VendorAppError(
        error.message,
        'UNKNOWN_ERROR',
        undefined,
        error
      )
    }
  } else if (typeof error === 'string') {
    vendorError = new VendorAppError(error, 'STRING_ERROR')
  } else {
    vendorError = new VendorAppError(
      translate ? translate(fallbackMessage.fr, fallbackMessage.ar) : fallbackMessage.fr,
      'UNKNOWN_ERROR',
      undefined,
      error
    )
  }

  // Log error if enabled
  if (logError) {
    console.error(`[VendorApp Error] ${vendorError.code}:`, {
      message: vendorError.message,
      statusCode: vendorError.statusCode,
      originalError: vendorError.originalError,
      stack: vendorError.stack,
    })
  }

  // Show toast if enabled
  if (showToast && toast && translate) {
    const errorMessage = getErrorMessage(vendorError, translate)
    toast({
      title: translate("Erreur", "خطأ"),
      description: errorMessage,
      variant: "destructive",
    })
  }

  return vendorError
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(
  error: VendorAppError,
  translate: (fr: string, ar: string) => string
): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return translate(
        "Impossible de se connecter au serveur. Vérifiez votre connexion Internet.",
        "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت."
      )
    case 'VALIDATION_ERROR':
      return error.message || translate(
        "Les données saisies ne sont pas valides.",
        "البيانات المدخلة غير صالحة."
      )
    case 'API_ERROR':
      if (error.statusCode === 401) {
        return translate(
          "Vous n'êtes pas autorisé à effectuer cette action.",
          "غير مصرح لك بتنفيذ هذا الإجراء."
        )
      }
      if (error.statusCode === 403) {
        return translate(
          "Accès refusé.",
          "تم رفض الوصول."
        )
      }
      if (error.statusCode === 404) {
        return translate(
          "Ressource introuvable.",
          "الموارد غير موجودة."
        )
      }
      if (error.statusCode === 429) {
        return translate(
          "Trop de requêtes. Veuillez réessayer plus tard.",
          "طلبات كثيرة جداً. يرجى المحاولة لاحقاً."
        )
      }
      if (error.statusCode >= 500) {
        return translate(
          "Erreur serveur. Veuillez réessayer plus tard.",
          "خطأ في الخادم. يرجى المحاولة لاحقاً."
        )
      }
      return error.message || translate(
        "Une erreur s'est produite lors de la communication avec le serveur.",
        "حدث خطأ أثناء التواصل مع الخادم."
      )
    case 'STORAGE_ERROR':
      return translate(
        "Impossible d'accéder au stockage local.",
        "تعذر الوصول إلى التخزين المحلي."
      )
    default:
      return error.message || translate(
        "Une erreur inattendue s'est produite.",
        "حدث خطأ غير متوقع."
      )
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  json: string | null,
  fallback: T
): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch (error) {
    handleError(error, {
      showToast: false,
      logError: true,
    })
    return fallback
  }
}

/**
 * Safe localStorage operations
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback
    }
    const item = window.localStorage.getItem(key)
    return safeJsonParse<T>(item, fallback)
  } catch (error) {
    handleError(new StorageError('Failed to read from localStorage', error), {
      showToast: false,
      logError: true,
    })
    return fallback
  }
}

export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    handleError(new StorageError('Failed to write to localStorage', error), {
      showToast: false,
      logError: true,
    })
    return false
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on validation errors or 4xx errors
      if (error instanceof ValidationError) {
        throw error
      }
      if (error instanceof APIError && error.statusCode && error.statusCode < 500) {
        throw error
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Validate API response
 */
export function validateAPIResponse<T>(
  response: Response,
  data: any
): asserts data is { success: true; data: T } | { success: false; error: any } {
  if (!response.ok) {
    throw new APIError(
      `API request failed with status ${response.status}`,
      response.status,
      data
    )
  }
}

/**
 * Safe fetch wrapper with error handling
 */
export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    return response
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network request failed', error)
    }
    throw error
  }
}

/**
 * Parse API response with error handling
 */
export async function parseAPIResponse<T>(response: Response): Promise<T> {
  try {
    const data = await response.json()
    validateAPIResponse(response, data)
    return data as T
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      'Failed to parse API response',
      response.status,
      undefined,
      error
    )
  }
}

