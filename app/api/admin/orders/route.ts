import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, apiRateLimit } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    if (apiRateLimit) {
      await applyRateLimit(request, apiRateLimit)
    }

    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can access all orders')
    }

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return successResponse({ orders })
  } catch (error) {
    console.error('[API] Error fetching all orders:', error)
    return errorResponse(error)
  }
}
