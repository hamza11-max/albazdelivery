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

    const customerId = request.nextUrl.searchParams.get('customerId') || session.user.id

    // Only admins can view other users' transactions
    if (session.user.role !== 'ADMIN' && customerId !== session.user.id) {
      throw new UnauthorizedError('Cannot access other user wallet')
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { customerId: customerId },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { customerId: customerId },
        include: { transactions: true },
      })
    }

    return successResponse({
      wallet: {
        balance: wallet.balance,
        transactions: wallet.transactions,
      },
    })
  } catch (error) {
    console.error('[API] Wallet transactions error:', error)
    return errorResponse(error)
  }
}
