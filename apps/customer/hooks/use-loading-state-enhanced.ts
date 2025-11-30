'use client'

import { useState, useCallback } from 'react'
import { useErrorHandler } from './use-error-handler'

export interface LoadingState {
  isLoading: boolean
  error: Error | null
}

export interface AsyncOperationOptions {
  onSuccess?: () => void
  onError?: (error: unknown) => void
  showErrorToast?: boolean
}

/**
 * Enhanced loading state hook with error handling
 * Provides loading state management for async operations
 */
export function useLoadingStateEnhanced(initialState: LoadingState = { isLoading: false, error: null }) {
  const [state, setState] = useState<LoadingState>(initialState)
  const { handleError } = useErrorHandler()

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading, error: isLoading ? null : prev.error }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }))
  }, [])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null })
  }, [])

  /**
   * Execute an async operation with loading state management
   */
  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: AsyncOperationOptions = {}
    ): Promise<T | null> => {
      const { onSuccess, onError, showErrorToast = true } = options

      setLoading(true)
      setError(null)

      try {
        const result = await operation()
        setLoading(false)
        onSuccess?.()
        return result
      } catch (error) {
        const handledError = handleError(error, {
          showToast: showErrorToast,
          logError: true,
        })
        setError(handledError instanceof Error ? handledError : new Error(String(handledError)))
        onError?.(error)
        return null
      }
    },
    [setLoading, setError, handleError]
  )

  return {
    ...state,
    setLoading,
    setError,
    reset,
    execute,
  }
}

