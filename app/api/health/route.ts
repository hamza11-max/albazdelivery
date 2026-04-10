import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/health - Health check endpoint (no database required)
export async function GET() {
  let databaseStatus = process.env.DATABASE_URL ? 'configured' : 'not_configured'

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`
      databaseStatus = 'reachable'
    } catch (error) {
      databaseStatus = 'unreachable'
      console.error('[Health] Database ping failed:', error)
    }
  }

  return NextResponse.json({
    success: true,
    message: 'AL-baz API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    routes: {
      migrated: 54,
      total: 54,
      progress: '100%',
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
    database: databaseStatus,
  })
}
