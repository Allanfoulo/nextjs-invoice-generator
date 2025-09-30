"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <Button onClick={retry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

// Hook for handling async errors in components
export function useAsyncError() {
  const [error, setError] = React.useState<Error | null>(null)

  const captureError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error)
    } else {
      setError(new Error(String(error)))
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, clearError }
}

// Wrapper component for async operations
export function AsyncErrorHandler({
  children,
  onError
}: {
  children: React.ReactNode
  onError?: (error: Error) => void
}) {
  const { captureError } = useAsyncError()

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault()
      captureError(event.error)
      onError?.(event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      captureError(event.reason)
      onError?.(event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [captureError, onError])

  return <>{children}</>
}