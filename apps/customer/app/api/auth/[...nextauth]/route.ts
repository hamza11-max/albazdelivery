import { handlers } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// Specify Node.js runtime for Netlify serverless functions
export const runtime = 'nodejs'

// Disable static generation for auth routes
export const dynamic = 'force-dynamic'

// Add debug logging wrapper
const GET = async (req: NextRequest) => {
  try {
    console.log('[Auth] Processing GET request', {
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      cookies: req.cookies.getAll(),
      env: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
      }
    })
    return await handlers.GET(req)
  } catch (error) {
    console.error('[Auth] Error processing request:', error)
    throw error
  }
}

const POST = async (req: NextRequest) => {
  try {
    console.log('[Auth] Processing POST request')
    return await handlers.POST(req)
  } catch (error) {
    console.error('[Auth] Error processing POST request:', error)
    throw error
  }
}

export { GET, POST }
