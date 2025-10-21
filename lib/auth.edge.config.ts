import type { NextAuthConfig } from 'next-auth'

/**
 * Lightweight Edge-compatible auth config for middleware
 * Does NOT import Prisma or bcrypt - keeps bundle size small
 */
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async authorized({ auth, request: { nextUrl } }) {
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
    async redirect({ url, baseUrl }) {
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
} satisfies NextAuthConfig
