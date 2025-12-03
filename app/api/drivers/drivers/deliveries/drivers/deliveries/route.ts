import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { emitOrderAssigned } from '@/root/lib/events'
import { OrderStatus } from '@/lib/constants'
import { z } from 'zod'

// GET /api/drivers/deliveries - Get available deliveries or driver's assigned deliveries
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only drivers and admins can access this endpoint
    if (session.user.role !== 'DRIVER' && session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only drivers can access deliveries')
    }

    const searchParams = request.nextUrl.searchParams
    const available = searchParams.get('available')
    const status = searchParams.get('status')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED']
      if (!validStatuses.includes(status.toUpperCase())) {
        return errorResponse(new Error('Invalid status'), 400)
      }
    }

    if (available === 'true') {
      // Get orders that are ready for pickup and not assigned to any driver
      const where: any = {
        status: OrderStatus.READY,
        driverId: null,
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
      const [total, availableOrders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          include: {
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
                city: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc', // First come, first served
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      return successResponse({ 
        deliveries: availableOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    }

    // Get orders assigned to the authenticated driver
    const where: any = {
      driverId: session.user.id,
    }

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
    const [total, driverOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
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
              city: true,
            },
          },
          items: {
            include: {
              product: true,
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
      deliveries: driverOrders,
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

// POST /api/drivers/deliveries - Accept a delivery (moved from /accept route)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only drivers can accept deliveries
    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can accept deliveries')
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
      return errorResponse(new Error('Invalid orderId format'), 400)
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        store: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (order.status !== 'READY') {
      return errorResponse(new Error('Order is not ready for pickup'), 400)
    }

    if (order.driverId) {
      return errorResponse(new Error('Order already assigned to a driver'), 400)
    }

    // Assign driver and update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: session.user.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
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
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log('[API] Driver accepted delivery:', session.user.id, '->', orderId)

    // Emit SSE event
  emitOrderAssigned(updatedOrder, session.user.id)

    // Create notification for customer
    await prisma.notification.create({
      data: {
        recipientId: order.customerId,
        recipientRole: 'CUSTOMER',
        type: 'DELIVERY_UPDATE',
        title: 'Driver Assigned',
        message: `Your order has been assigned to a driver and is on the way!`,
        relatedOrderId: orderId,
      },
    })

    return successResponse({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}

