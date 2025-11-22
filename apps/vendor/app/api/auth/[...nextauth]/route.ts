import { handlers } from '@/root/lib/auth'
import type { NextRequest } from 'next/server'

// Specify Node.js runtime for auth routes
export const runtime = 'nodejs'

// Disable static generation for auth routes
export const dynamic = 'force-dynamic'

// NextAuth API route handlers
const GET = async (req: NextRequest) => {
  try {
    return await handlers.GET(req)
  } catch (error) {
    console.error('[Vendor Auth] Error processing GET request:', error)
    throw error
  }
}

const POST = async (req: NextRequest) => {
  try {
    return await handlers.POST(req)
  } catch (error) {
    console.error('[Vendor Auth] Error processing POST request:', error)
    throw error
  }
}

export { GET, POST }

