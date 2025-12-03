import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { loyaltyTransactionsSchema } from '@/lib/validations/api'
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
      throw new ForbiddenError('Cannot access other user loyalty transactions')
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)
    const type = (typeParam || 'ALL').toUpperCase() as 'EARNED' | 'REDEEMED' | 'ALL'

    // Validate input
    try {
      loyaltyTransactionsSchema.parse({
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

    // Get loyalty account
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
      select: {
        id: true,
        points: true,
      },
    })

    if (!account) {
      throw new NotFoundError('Loyalty account')
    }

    // Build where clause for transactions
    const where: any = {
      loyaltyAccountId: account.id,
    }

    if (type !== 'ALL') {
      where.type = type
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          loyaltyAccount: {
            select: {
              id: true,
              customerId: true,
              points: true,
            },
          },
        },
      }),
      prisma.loyaltyTransaction.count({ where }),
    ])

    return successResponse({
      account: {
        points: account.points,
      },
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Loyalty transactions error:', error)
    return errorResponse(error)
  }
}
