import { NextResponse } from 'next/server'

// GET /api/health - Health check endpoint (no database required)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AL-baz API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    routes: {
      migrated: 28,
      total: 54,
      progress: '52%',
    },
    features: {
      authentication: '✅ Ready',
      orders: '✅ Ready',
      products: '✅ Ready',
      drivers: '✅ Ready',
      wallet: '✅ Ready',
      loyalty: '✅ Ready',
      notifications: '✅ Ready',
      admin: '✅ Ready',
    },
    database: process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured',
  })
}
