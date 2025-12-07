import NextAuth from 'next-auth'
import { edgeAuthConfig } from './auth.edge.config'

/**
 * Edge-compatible auth instance for middleware
 * Uses lightweight config without Prisma/bcrypt
 */
export const { auth: edgeAuth } = NextAuth(edgeAuthConfig)
