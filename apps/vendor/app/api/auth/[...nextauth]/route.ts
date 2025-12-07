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
    const hasSecret = !!process.env.NEXTAUTH_SECRET
    const hasUrl = !!process.env.NEXTAUTH_URL
    const secretValue = process.env.NEXTAUTH_SECRET
    const urlValue = process.env.NEXTAUTH_URL
    
    console.log('[Vendor Auth] Environment check:', {
      hasNextAuthSecret: hasSecret,
      nextAuthUrl: urlValue,
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      secretLength: secretValue?.length || 0,
    })
    
    // Warn if missing
    if (!hasSecret) {
      console.error('[Vendor Auth] ERROR: NEXTAUTH_SECRET is missing!')
      console.error('[Vendor Auth] This will cause a Configuration error in NextAuth.')
      console.error('[Vendor Auth] Make sure .env.local exists in apps/vendor/ with NEXTAUTH_SECRET set.')
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
    return await handlers.POST(req)
  } catch (error) {
    console.error('[Vendor Auth] Error processing POST request:', error)
    throw error
  }
}

export { GET, POST }

