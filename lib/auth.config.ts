import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { loginSchema } from './validations/auth'
import { prisma } from './prisma'
import { verifyPassword } from './password'

export const authConfig = {
  // Add pages config to ensure correct redirect URLs
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Add trusted host config for production
  trustHost: true,
  // Enable debug logs (visible in server logs)
  debug: true,
  // Remove custom cookies config to use NextAuth defaults
  // This prevents domain mismatch issues on Vercel
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        // Validate credentials
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email },
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
          role: user.role,
        }
      },
    }),
  ],
  // pages are already defined above
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
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
} as NextAuthConfig
