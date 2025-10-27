import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isLoading,
    session,
    status
  }
}