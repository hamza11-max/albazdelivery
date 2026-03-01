import { handlers } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// Specify Node.js runtime for Netlify serverless functions
export const runtime = 'nodejs'

// Disable static generation for auth routes
export const dynamic = 'force-dynamic'

// Add debug logging wrapper
const GET = async (req: NextRequest) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] GET', { url: req.url, hasSecret: !!process.env.NEXTAUTH_SECRET })
    }
    return await handlers.GET(req)
  } catch (error) {
    console.error('[Auth] Error processing request:', error)
    throw error
  }
}

const POST = async (req: NextRequest) => {
  try {
    if (process.env.NODE_ENV === 'development') console.log('[Auth] POST')
    return await handlers.POST(req)
  } catch (error) {
    console.error('[Auth] Error processing POST request:', error)
    throw error
  }
}

export { GET, POST }
