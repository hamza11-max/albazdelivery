import { handlers } from '@/lib/auth'

// Specify Node.js runtime for Netlify serverless functions
export const runtime = 'nodejs'

// Disable static generation for auth routes
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers
