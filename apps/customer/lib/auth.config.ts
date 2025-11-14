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
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials: Record<string, string> | undefined) {
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
          throw new Error('Your account is pending approval')
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
  secret: process.env.NEXTAUTH_SECRET,
}
