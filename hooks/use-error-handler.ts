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

      // Handle API error responses
      if (error && typeof error === 'object') {
        if ('response' in error && error.response) {
          const response = error.response as { data?: { error?: { message?: string } } }
          errorMessage = response.data?.error?.message || errorMessage
        } else if ('message' in error) {
          errorMessage = String(error.message)
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

