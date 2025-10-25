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

    const vendorId = session.user.id

    // Aggregate sales by customer
    const aggregates = await prisma.sale.groupBy({
      by: ['customerId'],
      where: { vendorId, NOT: { customerId: null } },
      _sum: { total: true },
      _max: { createdAt: true },
    })

    const customerIds = aggregates.map((a) => a.customerId!).filter(Boolean)
    const users = await prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true, phone: true },
    })

    const customers = aggregates.map((a) => {
      const u = users.find((x) => x.id === a.customerId)
      return {
        id: u?.id || a.customerId!,
        name: u?.name || 'Client',
        email: u?.email || undefined,
        phone: u?.phone || '',
        totalPurchases: a._sum.total || 0,
        lastPurchaseDate: a._max.createdAt || null,
      }
    })

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
