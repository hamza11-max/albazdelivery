import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for payment creation
const createPaymentSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'CARD', 'WALLET'], {
    errorMap: () => ({ message: 'Payment method must be CASH, CARD, or WALLET' }),
  }),
  transactionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)
    const { orderId, amount, method, transactionId } = validatedData
    const customerId = session.user.id

    // Verify order exists and belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
      },
      select: {
        id: true,
        total: true,
        status: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Verify order amount matches
    if (order.total !== amount) {
      return errorResponse(new Error('Payment amount does not match order total'), 400)
    }

    // Verify order is in a valid state for payment
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      return errorResponse(new Error('Cannot pay for a cancelled or delivered order'), 400)
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    })

    if (existingPayment) {
      return errorResponse(new Error('Payment already exists for this order'), 400)
    }

    // Create payment record and handle wallet deduction in a transaction
    const payment = await prisma.$transaction(async (tx: any) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          amount,
          method: method.toUpperCase(),
          status: 'PENDING',
          transactionId: transactionId || null,
          order: { connect: { id: orderId } },
          customer: { connect: { id: customerId } },
        },
      })

      // If payment method is wallet, deduct from wallet
      if (method === 'WALLET') {
        const wallet = await tx.wallet.findUnique({
          where: { customerId },
        })

        if (!wallet) {
          await tx.payment.update({
            where: { id: newPayment.id },
            data: { status: 'FAILED' },
          })
          throw new Error('Wallet not found')
        }

        if (wallet.balance < amount) {
          await tx.payment.update({
            where: { id: newPayment.id },
            data: { status: 'FAILED' },
          })
          throw new Error('Insufficient wallet balance')
        }

        // Deduct from wallet
        await tx.wallet.update({
          where: { customerId },
          data: {
            balance: { decrement: amount },
          },
        })

        // Create wallet transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -amount, // Negative for debit
            type: 'DEBIT',
            description: `Payment for order ${orderId}`,
            status: 'COMPLETED',
          },
        })

        // Update payment status
        await tx.payment.update({
          where: { id: newPayment.id },
          data: { status: 'COMPLETED' },
        })

        return { ...newPayment, status: 'COMPLETED' }
      }

      return newPayment
    })

    return successResponse({ payment }, 201)
  } catch (error) {
    console.error('[API] Payment creation error:', error)
    return errorResponse(error)
  }
}
