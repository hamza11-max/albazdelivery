import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { redeemRewardSchema } from '@/lib/validations/api'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const category = searchParams.get('category')
    const minPoints = searchParams.get('minPoints')
    const maxPoints = searchParams.get('maxPoints')
    const includeExpired = searchParams.get('includeExpired') === 'true'

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build where clause
    const where: any = {
      isActive: true,
    }

    // Filter by expiration date
    if (!includeExpired) {
      where.expiresAt = {
        gt: new Date(), // Only rewards that haven't expired
      }
    }

    // Filter by category if provided
    if (category) {
      where.category = category.toUpperCase()
    }

    // Filter by points range if provided
    if (minPoints || maxPoints) {
      where.pointsCost = {}
      if (minPoints) {
        const min = parseInt(minPoints)
        if (!isNaN(min)) {
          where.pointsCost.gte = min
        }
      }
      if (maxPoints) {
        const max = parseInt(maxPoints)
        if (!isNaN(max)) {
          where.pointsCost.lte = max
        }
      }
    }

    // Get total count and rewards with pagination
    const [total, rewards] = await Promise.all([
      prisma.loyaltyReward.count({ where }),
      prisma.loyaltyReward.findMany({
        where,
        orderBy: {
          pointsCost: 'asc', // Cheapest rewards first
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({ 
      rewards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Rewards error:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = redeemRewardSchema.parse(body)
    const { rewardId } = validatedData
    const customerId = session.user.id

    // Get reward from database
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    })

    if (!reward) {
      return errorResponse(new Error('Reward not found'), 404)
    }

    if (!reward.isActive) {
      return errorResponse(new Error('Reward is not available'), 400)
    }

    if (reward.expiresAt < new Date()) {
      return errorResponse(new Error('Reward has expired'), 400)
    }

    // Get loyalty account
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
    })

    if (!account) {
      return errorResponse(new Error('Loyalty account not found'), 404)
    }

    if (account.points < reward.pointsCost) {
      return errorResponse(new Error('Insufficient points'), 400)
    }

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct points
      await tx.loyaltyAccount.update({
        where: { customerId },
        data: {
          points: { decrement: reward.pointsCost },
          totalPointsRedeemed: { increment: reward.pointsCost },
        },
      })

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'REDEEM',
          points: reward.pointsCost,
          description: `Redeemed reward: ${reward.name}`,
        },
      })

      // Create redemption record
      const redemption = await tx.customerRedemption.create({
        data: {
          customerId,
          loyaltyAccountId: account.id,
          rewardId: reward.id,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      return { transaction, redemption, reward }
    })

    return successResponse({
      message: 'Reward redeemed successfully',
      redemption: result.redemption,
      reward: result.reward,
    })
  } catch (error) {
    console.error('[API] Reward redemption error:', error)
    return errorResponse(error)
  }
}
