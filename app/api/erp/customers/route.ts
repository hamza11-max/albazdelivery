import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch all customers who have ordered from this vendor
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access customers')
    }

    // Get unique customers who ordered from this vendor
    const orders = await prisma.order.findMany({
      where: { vendorId: session.user.id },
      select: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      distinct: ['customerId'],
    })

    const customers = orders
      .map(o => o.customer)
      .filter(c => c !== null)

    return successResponse({ customers })
  } catch (error) {
    console.error('[API] Customers GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new customer (stub for future implementation)
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create customers')
    }

    // For now, return a message that customers are created through registration
    return successResponse({
      message: 'Customers are created through user registration',
    })
  } catch (error) {
    console.error('[API] Customers POST error:', error)
    return errorResponse(error)
  }
}
