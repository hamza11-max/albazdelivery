import type { ReactNode } from 'react'

declare module 'next-auth/react' {
  interface SignInResponse {
    error: string | undefined
    code: string | undefined
    status: number
    ok: boolean
    url: string | null
  }

  export function useSession(): {
    data: {
      user?: {
        id?: string
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
        status?: string
        phone?: string | null
        address?: string | null
        city?: string | null
      }
    } | null
    status: 'loading' | 'authenticated' | 'unauthenticated'
  }
  
  export function signIn(
    provider?: string,
    options?: Record<string, unknown>,
    authorizationParams?: Record<string, string>
  ): Promise<SignInResponse | undefined>
  export function signOut(options?: { callbackUrl?: string }): Promise<void>
  export function SessionProvider(props: {
    children: ReactNode
    session?: unknown
    refetchInterval?: number
    refetchOnWindowFocus?: boolean
  }): JSX.Element
}

