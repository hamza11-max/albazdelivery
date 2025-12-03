import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return errorResponse(new Error('orderId is required'), 400)
    }

    // Validate orderId format
    try {
      z.string().cuid().parse(orderId)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    // Get order with related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Authorization: Users can only predict for their own orders (except admin)
    if (session.user.role !== 'ADMIN') {
      const hasAccess =
        order.customerId === session.user.id ||
        order.vendorId === session.user.id ||
        order.driverId === session.user.id

      if (!hasAccess) {
        throw new UnauthorizedError('You can only predict delivery times for your own orders')
      }
    }

    // Enhanced prediction algorithm
    // Base preparation time: 15 minutes
    let preparationTime = 15

    // Add time based on number of items (2 minutes per item)
    preparationTime += order.items.length * 2

    // Add time based on item complexity (estimate based on category)
    const complexItems = order.items.filter((item: any) =>
      item.product?.category && ['PIZZA', 'BURGER', 'SANDWICH'].includes(item.product.category.toUpperCase())
    )
    preparationTime += complexItems.length * 3

    // Delivery time: base 25 minutes + distance estimation (simplified)
    const deliveryTime = 25

    // Confidence based on order complexity
    const itemCount = order.items.length
    const confidence = itemCount <= 3 ? 0.9 : itemCount <= 5 ? 0.85 : 0.75

    return successResponse({
      prediction: {
        orderId,
        estimatedPickupTime: preparationTime,
        estimatedDeliveryTime: deliveryTime,
        totalEstimatedTime: preparationTime + deliveryTime,
        confidence,
        factors: {
          itemCount: order.items.length,
          complexItems: complexItems.length,
        },
      },
    })
  } catch (error) {
    console.error('[API] Prediction error:', error)
    return errorResponse(error)
  }
}

