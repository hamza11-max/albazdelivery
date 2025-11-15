import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations/order'
import { emitOrderCreated } from '@/lib/events'
import { OrderStatus } from '@/lib/constants'

// GET /api/orders - Get all orders or filter by customer
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Get authenticated user
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const driverId = searchParams.get('driverId')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build query based on user role
    const where: any = {}

    if (session.user.role === 'CUSTOMER') {
      // Customers can only see their own orders
      where.customerId = session.user.id
    } else if (session.user.role === 'VENDOR') {
      // Vendors can only see orders for their stores
      where.vendorId = session.user.id
    } else if (session.user.role === 'DRIVER') {
      // Drivers can see assigned orders or available orders
      where.OR = [
        { driverId: session.user.id },
        { status: OrderStatus.READY, driverId: null },
      ]
    } else if (session.user.role === 'ADMIN') {
      // Admins can filter by customerId, vendorId, or driverId if provided
      if (customerId) {
        where.customerId = customerId
      }
      if (vendorId) {
        where.vendorId = vendorId
      }
      if (driverId) {
        where.driverId = driverId
      }
    }

    // Add status filter if provided
    if (status) {
      where.status = status.toUpperCase()
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Get total count and orders with pagination
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({ 
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Get authenticated user
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)
    const {
      storeId,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      deliveryAddress,
      city,
      customerPhone,
    } = validatedData

    // Get store and vendor information
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, vendorId: true, isActive: true },
    })

    if (!store || !store.isActive) {
      return errorResponse(new Error('Store not found or inactive'), 404)
    }

    // Create order with items in a transaction
    const order = await prisma.order.create({
      data: {
        customerId: session.user.id,
        vendorId: store.vendorId,
        storeId,
        subtotal,
        deliveryFee,
        total,
        status: 'PENDING',
        paymentMethod: (paymentMethod?.toUpperCase() as 'CASH' | 'CARD' | 'WALLET') || 'CASH',
        deliveryAddress,
        city,
        customerPhone,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
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

    console.log('[API] Order created:', order.id)

  // Emit order created event for SSE
  emitOrderCreated(order)

    // Award loyalty points (5% of total)
    const pointsToAward = Math.floor(total * 0.05)
    if (pointsToAward > 0) {
      await prisma.loyaltyAccount.update({
        where: { customerId: session.user.id },
        data: {
          points: { increment: pointsToAward },
          totalPointsEarned: { increment: pointsToAward },
        },
      })

      await prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: session.user.id,
          type: 'EARN',
          points: pointsToAward,
          description: `Points earned from order ${order.id}`,
          relatedOrderId: order.id,
        },
      })
    }

    return successResponse({ order }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
