import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // Return predefined rewards catalog
    // TODO: Move to database table if needed
    const rewards = [
      {
        id: 'reward-1',
        name: 'Livraison Gratuite',
        description: 'Livraison gratuite sur votre prochaine commande',
        pointsCost: 100,
        type: 'DISCOUNT',
        value: 0,
        icon: '🚚',
      },
      {
        id: 'reward-2',
        name: 'Réduction 10%',
        description: '10% de réduction sur votre prochaine commande',
        pointsCost: 200,
        type: 'DISCOUNT',
        value: 10,
        icon: '🎁',
      },
      {
        id: 'reward-3',
        name: 'Réduction 20%',
        description: '20% de réduction sur votre prochaine commande',
        pointsCost: 400,
        type: 'DISCOUNT',
        value: 20,
        icon: '💎',
      },
    ]

    return successResponse({ rewards })
  } catch (error) {
    console.error('[API] Rewards error:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { customerId, rewardId, pointsCost } = await request.json()

    if (!customerId || !rewardId || !pointsCost) {
      return errorResponse(new Error('Missing required fields'), 400)
    }

    // Get loyalty account
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
    })

    if (!account) {
      return errorResponse(new Error('Loyalty account not found'), 404)
    }

    if (account.points < pointsCost) {
      return errorResponse(new Error('Insufficient points'), 400)
    }

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct points
      await tx.loyaltyAccount.update({
        where: { customerId },
        data: {
          points: { decrement: pointsCost },
          totalPointsRedeemed: { increment: pointsCost },
        },
      })

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'REDEEM',
          points: pointsCost,
          description: `Redeemed reward: ${rewardId}`,
        },
      })

      return { transaction }
    })

    return successResponse({
      message: 'Reward redeemed successfully',
      transaction: result.transaction,
    })
  } catch (error) {
    console.error('[API] Reward redemption error:', error)
    return errorResponse(error)
  }
}
