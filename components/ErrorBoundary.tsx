'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@albaz/ui'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    })

    // Send to Sentry or other error tracking service
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        })
      }).catch(() => {
        // Sentry not available, already logged to console
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Call optional reset handler
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full">
            <div className="bg-card border border-border rounded-lg p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Oops! Something went wrong
              </h2>

              <p className="text-muted-foreground mb-6">
                We're sorry, but something unexpected happened. Please try again.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-semibold text-muted-foreground mb-2">
                    Error Details (Dev Only)
                  </summary>
                  <div className="bg-muted p-4 rounded-lg overflow-auto max-h-48">
                    <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary wrapper (for functional components)
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallbackComponent?: ReactNode
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return WithErrorBoundary
}

