import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const { orderId, amount, method, transactionId } = await request.json()
    const customerId = session.user.id

    if (!orderId || !amount || !method) {
      return errorResponse(new Error('Missing required fields: orderId, amount, method'), 400)
    }

    // Verify order exists and belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        method: method.toUpperCase(),
        status: 'PENDING',
        transactionId: transactionId || null,
        order: { connect: { id: orderId } },
        customer: { connect: { id: customerId } },
      },
    })

    // If payment method is wallet, deduct from wallet
    if (method.toLowerCase() === 'wallet') {
      const wallet = await prisma.wallet.findUnique({
        where: { customerId: customerId },
      })

      if (!wallet || wallet.balance < parseFloat(amount)) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        })
        return errorResponse(new Error('Insufficient wallet balance'), 400)
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { customerId: customerId },
        data: {
          balance: { decrement: parseFloat(amount) },
        },
      })

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      })

      // Note: Order model does not have `paymentStatus` in Prisma schema.
      // Payment relation records the payment; update order fields here if your
      // schema has a specific field (e.g., status) to reflect payment.
    }

    return successResponse({ payment })
  } catch (error) {
    console.error('[API] Payment creation error:', error)
    return errorResponse(error)
  }
}
