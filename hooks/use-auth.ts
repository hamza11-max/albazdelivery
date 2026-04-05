import { useEffect, useState } from 'react'

export function useAuth() {
  const [session, setSession] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
          const authState = await window.electronAPI.auth.checkAuth()
          if (cancelled) return
          if (authState?.isAuthenticated && authState.user) {
            setSession({ user: authState.user })
            setStatus('authenticated')
          } else {
            setSession(null)
            setStatus('unauthenticated')
          }
          return
        }

        // Web fallback without next-auth hook to avoid hard crashes in Electron runtime.
        const response = await fetch('/api/auth/session', { credentials: 'same-origin' })
        if (cancelled) return
        if (!response.ok) {
          setSession(null)
          setStatus('unauthenticated')
          return
        }
        const data = await response.json()
        if (cancelled) return
        if (data?.user) {
          setSession(data)
          setStatus('authenticated')
        } else {
          setSession(null)
          setStatus('unauthenticated')
        }
      } catch {
        if (!cancelled) {
          setSession(null)
          setStatus('unauthenticated')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return {
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    session,
    status
  }
}