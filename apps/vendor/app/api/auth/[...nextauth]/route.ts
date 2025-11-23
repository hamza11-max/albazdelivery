import { handlers } from '@/root/lib/auth'
import type { NextRequest } from 'next/server'

// Specify Node.js runtime for auth routes
export const runtime = 'nodejs'

// Disable static generation for auth routes
export const dynamic = 'force-dynamic'

// Debug: Log environment variables (only in development, once per server instance)
let envCheckLogged = false
function logEnvironmentCheck() {
  if (process.env.NODE_ENV === 'development' && !envCheckLogged) {
    envCheckLogged = true
    // NextAuth v5 uses AUTH_SECRET, but also supports NEXTAUTH_SECRET for backwards compatibility
    const hasAuthSecret = !!process.env.AUTH_SECRET
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    const hasSecret = hasAuthSecret || hasNextAuthSecret
    const hasUrl = !!process.env.NEXTAUTH_URL
    const secretValue = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    const urlValue = process.env.NEXTAUTH_URL
    
    console.log('[Vendor Auth] Environment check:', {
      hasAuthSecret: hasAuthSecret,
      hasNextAuthSecret: hasNextAuthSecret,
      hasSecret: hasSecret,
      nextAuthUrl: urlValue,
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      secretLength: secretValue?.length || 0,
    })
    
    // Warn if missing
    if (!hasSecret) {
      console.error('[Vendor Auth] ERROR: AUTH_SECRET (or NEXTAUTH_SECRET) is missing!')
      console.error('[Vendor Auth] This will cause a Configuration error in NextAuth.')
      console.error('[Vendor Auth] NextAuth v5 requires AUTH_SECRET in .env.local')
      console.error('[Vendor Auth] Make sure .env.local exists in apps/vendor/ with AUTH_SECRET set.')
      console.error('[Vendor Auth] Generate one with: openssl rand -base64 32')
    }
    if (!hasUrl) {
      console.error('[Vendor Auth] ERROR: NEXTAUTH_URL is missing!')
      console.error('[Vendor Auth] This will cause a Configuration error in NextAuth.')
      console.error('[Vendor Auth] Make sure .env.local exists in apps/vendor/ with NEXTAUTH_URL set.')
    }
  }
}

// NextAuth API route handlers
const GET = async (req: NextRequest) => {
  // Log environment check once on first request
  logEnvironmentCheck()
  
  try {
    return await handlers.GET(req)
  } catch (error) {
    console.error('[Vendor Auth] Error processing GET request:', error)
    throw error
  }
}

const POST = async (req: NextRequest) => {
  // Log environment check once on first request
  logEnvironmentCheck()
  
  try {
    const response = await handlers.POST(req)
    return response
  } catch (error: any) {
    console.error('[Vendor Auth] Error processing POST request:', error)
    console.error('[Vendor Auth] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    // If it's a Configuration error, provide more details
    if (error?.message?.includes('Configuration') || error?.message?.includes('secret')) {
      console.error('[Vendor Auth] Configuration error detected!')
      console.error('[Vendor Auth] This usually means AUTH_SECRET is missing or invalid.')
      console.error('[Vendor Auth] Current env check:', {
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      })
    }
    throw error
  }
}

export { GET, POST }

