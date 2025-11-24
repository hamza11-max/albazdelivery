import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Ensure secret is available before initializing NextAuth
// NextAuth v5 will throw Configuration error if secret is missing
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
if (!secret && process.env.NODE_ENV !== 'development') {
  throw new Error(
    'AUTH_SECRET or NEXTAUTH_SECRET environment variable is required. ' +
    'NextAuth v5 requires AUTH_SECRET to be set in your .env.local file.'
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
