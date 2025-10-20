import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const { orderId } = await request.json()

    if (!orderId) {
      return errorResponse(new Error('orderId is required'), 400)
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Simple prediction algorithm
    const preparationTime = 15 + order.items.length * 2
    const deliveryTime = 25
    const confidence = 0.85

    return successResponse({
      prediction: {
        orderId,
        estimatedPickupTime: preparationTime,
        estimatedDeliveryTime: deliveryTime,
        totalEstimatedTime: preparationTime + deliveryTime,
        confidence,
      },
    })
  } catch (error) {
    console.error('[API] Prediction error:', error)
    return errorResponse(error)
  }
}
