import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { walletTransactionsSchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const customerIdParam = searchParams.get('customerId')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const typeParam = searchParams.get('type')

    // Determine customerId - customers see their own, admins can specify
    let customerId = session.user.id
    if (session.user.role === 'ADMIN' && customerIdParam) {
      customerId = customerIdParam
      // Validate customerId format
      try {
        z.string().cuid().parse(customerId)
      } catch {
        return errorResponse(new Error('Invalid customer ID format'), 400)
      }
    } else if (session.user.role !== 'ADMIN' && customerIdParam && customerIdParam !== session.user.id) {
      throw new ForbiddenError('Cannot access other user wallet transactions')
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)
    const type = (typeParam || 'ALL').toUpperCase() as 'CREDIT' | 'DEBIT' | 'ALL'

    // Validate input
    try {
      walletTransactionsSchema.parse({
        customerId: customerIdParam || undefined,
        page,
        limit,
        type,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(new Error(error.errors[0].message), 400)
      }
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
      select: {
        id: true,
        balance: true,
      },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { customerId },
        select: {
          id: true,
          balance: true,
        },
      })
    }

    // Build where clause for transactions
    const where: any = {
      walletId: wallet.id,
    }

    if (type !== 'ALL') {
      where.type = type
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wallet: {
            select: {
              id: true,
              customerId: true,
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where }),
    ])

    return successResponse({
      wallet: {
        balance: wallet.balance,
        transactions,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Wallet transactions error:', error)
    return errorResponse(error)
  }
}
