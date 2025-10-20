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

    // Customers can only view their own transactions
    const customerId = request.nextUrl.searchParams.get('customerId') || session.user.id

    if (session.user.role !== 'ADMIN' && customerId !== session.user.id) {
      throw new UnauthorizedError('Cannot access other user transactions')
    }

    // Get loyalty account
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
    })

    if (!account) {
      return errorResponse(new Error('Loyalty account not found'), 404)
    }

    // Get transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: {
        loyaltyAccountId: account.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 transactions
    })

    return successResponse({ transactions })
  } catch (error) {
    console.error('[API] Loyalty transactions error:', error)
    return errorResponse(error)
  }
}
