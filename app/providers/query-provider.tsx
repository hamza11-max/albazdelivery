'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import devtools only in development to avoid build errors
// If the package is not installed, this will gracefully fail
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? dynamic(
      () =>
        import('@tanstack/react-query-devtools').then((mod) => ({
          default: mod.ReactQueryDevtools,
        })),
      { ssr: false }
    )
  : null

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes
            staleTime: 1000 * 60 * 5,
            // Cache time: 10 minutes
            gcTime: 1000 * 60 * 10,
            // Retry failed requests
            retry: 3,
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus in production
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

