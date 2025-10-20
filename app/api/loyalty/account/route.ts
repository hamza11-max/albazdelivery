import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET /api/loyalty/account - Get loyalty account with transaction history
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Customers can only view their own account, admins can view any
    const customerId = session.user.role === 'ADMIN'
      ? request.nextUrl.searchParams.get('customerId') || session.user.id
      : session.user.id

    // Get or create loyalty account
    let account = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 transactions
        },
      },
    })

    // Create account if it doesn't exist
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          customerId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          transactions: true,
        },
      })
    }

    return successResponse({ account })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/loyalty/account - Update loyalty points (admin only for direct updates)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { customerId, points, description, orderId } = body

    if (!customerId || points === undefined) {
      return errorResponse(new Error('customerId and points are required'), 400)
    }

    // Only admin can manually adjust points
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can manually adjust loyalty points')
    }

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Get or create account
      let account = await tx.loyaltyAccount.findUnique({
        where: { customerId },
      })

      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: { customerId },
        })
      }

      // Determine transaction type
      const type = points > 0 ? 'EARN' : 'REDEEM'
      const absPoints = Math.abs(points)

      // Check if sufficient points for redemption
      if (type === 'REDEEM' && account.points < absPoints) {
        throw new Error('Insufficient loyalty points')
      }

      // Update loyalty account
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { customerId },
        data: {
          points: {
            increment: points, // Can be positive or negative
          },
          ...(type === 'EARN' && {
            totalPointsEarned: {
              increment: absPoints,
            },
          }),
          ...(type === 'REDEEM' && {
            totalPointsRedeemed: {
              increment: absPoints,
            },
          }),
        },
      })

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type,
          points: absPoints,
          description: description || `Manual ${type.toLowerCase()} by admin`,
          relatedOrderId: orderId,
        },
      })

      // Check and update tier based on total points earned
      const newTier = calculateTier(updatedAccount.totalPointsEarned)
      if (newTier !== updatedAccount.tier) {
        await tx.loyaltyAccount.update({
          where: { customerId },
          data: {
            tier: newTier,
            tierExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        })
      }

      return { account: updatedAccount, transaction }
    })

    console.log('[API] Loyalty points updated:', customerId, 'points:', points)

    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

// Helper function to calculate membership tier
function calculateTier(totalPointsEarned: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (totalPointsEarned >= 10000) return 'PLATINUM'
  if (totalPointsEarned >= 5000) return 'GOLD'
  if (totalPointsEarned >= 2000) return 'SILVER'
  return 'BRONZE'
}
