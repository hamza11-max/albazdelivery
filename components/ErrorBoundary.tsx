"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

function errorBoundaryLabels(): {
  title: string
  fallbackMsg: string
  retry: string
  reload: string
  detailsSummary: string
} {
  if (typeof document === "undefined") {
    return {
      title: "Une erreur est survenue",
      fallbackMsg: "Une erreur inattendue s'est produite.",
      retry: "Réessayer",
      reload: "Recharger la page",
      detailsSummary: "Détails de l'erreur (développement)",
    }
  }
  const lang = document.documentElement.lang || "fr"
  if (lang === "ar") {
    return {
      title: "حدث خطأ",
      fallbackMsg: "حدث خطأ غير متوقع.",
      retry: "إعادة المحاولة",
      reload: "إعادة تحميل الصفحة",
      detailsSummary: "تفاصيل الخطأ (تطوير)",
    }
  }
  if (lang === "en") {
    return {
      title: "Something went wrong",
      fallbackMsg: "An unexpected error occurred.",
      retry: "Try again",
      reload: "Reload page",
      detailsSummary: "Error details (development)",
    }
  }
  return {
    title: "Une erreur est survenue",
    fallbackMsg: "Une erreur inattendue s'est produite.",
    retry: "Réessayer",
    reload: "Recharger la page",
    detailsSummary: "Détails de l'erreur (développement)",
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo)
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // You can also log to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const labels = errorBoundaryLabels()
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>{labels.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || labels.fallbackMsg}
              </p>
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {labels.retry}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                  className="flex-1"
                >
                  {labels.reload}
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm cursor-pointer text-muted-foreground">
                    {labels.detailsSummary}
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

