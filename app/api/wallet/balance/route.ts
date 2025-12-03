import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { walletTransactionSchema } from '@/lib/validations/api'
import { z } from 'zod'

// GET /api/wallet/balance - Get wallet balance
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Customers can only view their own wallet, admins can view any
    let customerId = session.user.id
    if (session.user.role === 'ADMIN') {
      const requestedCustomerId = request.nextUrl.searchParams.get('customerId')
      if (requestedCustomerId) {
        // Validate customerId format
        try {
          z.string().cuid().parse(requestedCustomerId)
          customerId = requestedCustomerId
        } catch {
          return errorResponse(new Error('Invalid customerId format'), 400)
        }
      }
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
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
        },
      })
    }

    return successResponse({ wallet })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/wallet/balance - Add or deduct balance (admin only for direct operations)
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
    
    // Validate input with schema
    const validatedData = walletTransactionSchema.extend({
      customerId: z.string().cuid('Invalid customerId format'),
      relatedOrderId: z.string().cuid().optional(),
    }).parse(body)
    
    const { customerId, amount, description, relatedOrderId } = validatedData

    // Only customer themselves or admin can update wallet
    if (session.user.role !== 'ADMIN' && customerId !== session.user.id) {
      throw new ForbiddenError('You can only manage your own wallet')
    }

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Get or create wallet
      let wallet = await tx.wallet.findUnique({
        where: { customerId },
      })

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            customerId,
          },
        })
      }

      // Determine transaction type
      const type = amount > 0 ? 'CREDIT' : 'DEBIT'
      const absAmount = Math.abs(amount)

      // Check if sufficient balance for debit
      if (type === 'DEBIT' && wallet.balance < absAmount) {
        throw new Error('Insufficient wallet balance')
      }

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { customerId },
        data: {
          balance: {
            increment: amount, // Can be positive or negative
          },
          ...(type === 'CREDIT' && {
            totalEarned: {
              increment: absAmount,
            },
          }),
          ...(type === 'DEBIT' && {
            totalSpent: {
              increment: absAmount,
            },
          }),
        },
      })

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: absAmount,
          description: description || `Wallet ${type.toLowerCase()}`,
          relatedOrderId,
        },
      })

      return { wallet: updatedWallet, transaction }
    })

    console.log('[API] Wallet updated:', customerId, 'amount:', amount)

    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
