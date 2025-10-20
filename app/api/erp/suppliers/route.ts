import { NextRequest } from 'next/server'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch all suppliers (stub - to be implemented)
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access suppliers')
    }

    // Return empty suppliers for now
    // TODO: Implement supplier management in database
    return successResponse({ suppliers: [] })
  } catch (error) {
    console.error('[API] Suppliers GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new supplier (stub - to be implemented)
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create suppliers')
    }

    // TODO: Implement supplier creation
    return successResponse({
      message: 'Supplier management will be available soon',
    })
  } catch (error) {
    console.error('[API] Suppliers POST error:', error)
    return errorResponse(error)
  }
}
