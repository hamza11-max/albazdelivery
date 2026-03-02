'use client'

import { useCallback } from 'react'
import { useToast } from './use-toast'

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

/**
 * Custom hook for centralized error handling
 * Provides consistent error handling with toast notifications
 */
export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logError = true,
        fallbackMessage = 'Une erreur est survenue. Veuillez réessayer.',
      } = options

      // Log error for debugging
      if (logError) {
        console.error('[Error Handler]:', error)
      }

      // Extract error message
      let errorMessage = fallbackMessage
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }

      // Show toast notification
      if (showToast) {
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
      }

      // Return error for further handling if needed
      return error
    },
    [toast]
  )

  const handleApiError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      let errorMessage = 'Erreur lors de la communication avec le serveur'

      // Handle API error responses (including APIError with details)
      if (error && typeof error === 'object') {
        const err = error as { message?: string; details?: { details?: { path?: string; message?: string }[] } }
        if (err.message) errorMessage = String(err.message)
        // APIError.details is the full error object; validation array may be at .details.details
        const validationDetails = Array.isArray(err.details?.details) ? err.details.details : Array.isArray(err.details) ? err.details : []
        if (validationDetails.length > 0) {
          const lines = validationDetails.slice(0, 3).map((d: { path?: string; message?: string }) => d.message || d.path || '').filter(Boolean)
          if (lines.length > 0) errorMessage = `${errorMessage}: ${lines.join('; ')}`
        }
      }

      return handleError(error, {
        ...options,
        fallbackMessage: errorMessage,
      })
    },
    [handleError]
  )

  const handleValidationError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      let errorMessage = 'Veuillez vérifier les informations saisies'

      if (error && typeof error === 'object' && 'errors' in error) {
        const validationErrors = error.errors as Array<{ message?: string }>
        if (validationErrors.length > 0) {
          errorMessage = validationErrors[0].message || errorMessage
        }
      }

      return handleError(error, {
        ...options,
        fallbackMessage: errorMessage,
      })
    },
    [handleError]
  )

  return {
    handleError,
    handleApiError,
    handleValidationError,
  }
}

