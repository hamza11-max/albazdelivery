declare module 'next-auth/react' {
  export function useSession(): {
    data: {
      user?: {
        id?: string
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
      }
    } | null
    status: 'loading' | 'authenticated' | 'unauthenticated'
  }
  
  export function signOut(options?: { callbackUrl?: string }): Promise<void>
}

