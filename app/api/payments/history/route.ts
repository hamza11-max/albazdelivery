import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Customers can only view their own payments
    // Admins can view any customer's payments
    const customerId = request.nextUrl.searchParams.get('customerId') || session.user.id

    if (session.user.role !== 'ADMIN' && customerId !== session.user.id) {
      throw new UnauthorizedError('Cannot access other user payment history')
    }

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          customerId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ payments })
  } catch (error) {
    console.error('[API] Payment history error:', error)
    return errorResponse(error)
  }
}
