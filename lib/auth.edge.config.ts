// @ts-nocheck
import type { NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'ADMIN'
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  }

  // @ts-ignore - Ignoring type error for Session interface
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'ADMIN'
      status: 'PENDING' | 'APPROVED' | 'REJECTED'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'ADMIN'
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  }
}

/**
 * Lightweight Edge-compatible auth config for middleware
 * Does NOT import Prisma or bcrypt - keeps bundle size small
 */
// @ts-ignore - Ignoring type error for auth config
export const edgeAuthConfig: NextAuthConfig = {
  providers: [],
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
        secure: true,
      },
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Single callbacks object (merged) including redirect handling
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
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
      const isOnDashboard = nextUrl.pathname.startsWith('/admin') ||
                           nextUrl.pathname.startsWith('/vendor') ||
                           nextUrl.pathname.startsWith('/driver')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }

      return true
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch (e) {
        // ignore malformed URLs
      }
      return baseUrl
    },
  },
} as const
