import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function useAuth() {
  // Safely handle useSession during build time
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  return {
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isLoading,
    session,
    status
  }
}