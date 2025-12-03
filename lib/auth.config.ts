import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { loginSchema, algerianPhoneRegex } from './validations/auth'
import { prisma } from './prisma'
import { verifyPassword } from './password'

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'ADMIN'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    phone?: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
      status: 'PENDING' | 'APPROVED' | 'REJECTED'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  }
}

// Ensure secret is available - NextAuth v5 requires this at initialization
const getSecret = () => {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }
  // Generate a fallback secret for development (not secure for production!)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] ⚠️  NEXTAUTH_SECRET is missing!')
    console.warn('[Auth] Using a temporary development secret. Sessions may not persist across restarts.')
    // Return a fixed development secret (not secure, but allows development)
    return 'dev-secret-not-for-production-' + process.cwd().replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }
  console.error('[Auth] ❌ NEXTAUTH_SECRET is missing! This will cause authentication to fail.')
  throw new Error('NEXTAUTH_SECRET environment variable is required for production')
}

export const authConfig = {
  // Add pages config to ensure correct redirect URLs
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Add trusted host config for production
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS required)
      }
    }
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      async authorize(credentials: any) {
        // Validate credentials
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { identifier, password } = validatedFields.data
        const trimmedIdentifier = identifier.trim()
        const isPhoneLogin = algerianPhoneRegex.test(trimmedIdentifier)
        const normalizedIdentifier = isPhoneLogin ? trimmedIdentifier : trimmedIdentifier.toLowerCase()

        // Find user in database
        const user = await prisma.user.findUnique({
          where: isPhoneLogin ? { phone: normalizedIdentifier } : { email: normalizedIdentifier },
        })

        if (!user || !user.password) {
          return null
        }

        // Check if user is approved
        if (user.status !== 'APPROVED') {
          // Throw error - NextAuth will convert this to CredentialsSignin
          // The error message won't be passed to client, but we handle status via API check
          throw new Error('Account pending approval')
        }

        // Verify password
        const passwordsMatch = await verifyPassword(password, user.password)

        if (!passwordsMatch) {
          return null
        }

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          status: user.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        }
      },
    }),
  ],
  // pages are already defined above
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
        token.status = user.status as 'PENDING' | 'APPROVED' | 'REJECTED'
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.status = token.status
      }
      return session
    },
    async signIn({ user, account, profile, email, credentials }: any) {
      return true
    },
    async authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: getSecret(),
}
