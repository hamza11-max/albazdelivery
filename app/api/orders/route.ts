import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { createOrderSchema } from '@/root/lib/validations/order'
import { emitOrderCreated } from '@/root/lib/events'
import { sendOrderPlacedCustomerEmail } from '@/root/lib/mail/notify-customer-transactional'
import { OrderStatus } from '@/lib/constants'
import { resolveVendorOwnerContextId } from '@/lib/vendor-staff-access'
import { createStorefrontOrder } from '@/lib/storefront/create-order'

// GET /api/orders - Get all orders or filter by customer
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    // Get authenticated user
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const sessionRole = String(session.user.role ?? '').toUpperCase()

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

    if (sessionRole === 'CUSTOMER') {
      // Customers can only see their own orders
      where.customerId = session.user.id
    } else if (sessionRole === 'VENDOR') {
      const vendorScopeId = await resolveVendorOwnerContextId(session.user.id)
      where.vendorId = vendorScopeId
    } else if (sessionRole === 'DRIVER') {
      // Drivers can see assigned orders or available orders
      where.OR = [
        { driverId: session.user.id },
        { status: OrderStatus.READY, driverId: null },
      ]
    } else if (sessionRole === 'ADMIN') {
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
    } else {
      throw new ForbiddenError('You do not have access to order listings')
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
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
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
    await applyRateLimit(request, rateLimitConfigs.api)

    const body = await request.json()
    if (isStorefrontOrderPayload(body)) {
      const result = await createStorefrontOrder({
        rawBody: body,
        tenantHost: request.headers.get('x-tenant-host'),
      })
      return successResponse(result, 201)
    }

    // Get authenticated user
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Parse and validate request body
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
            email: true,
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

    try {
      const mailResult = await sendOrderPlacedCustomerEmail({
        to: order.customer.email,
        name: order.customer.name,
        orderId: order.id,
      })
      if (mailResult.ok === false) {
        console.error('[POST /api/orders] order_placed email failed', mailResult.error)
      }
    } catch (e) {
      console.error('[POST /api/orders] order_placed email error', e)
    }

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

function isStorefrontOrderPayload(body: any): boolean {
  if (!body || !Array.isArray(body.items)) return false
  return Boolean(
    body.vendorSlug ||
      body.customer ||
      body.clientName ||
      body.clientPhone ||
      body.clientAddress ||
      body.notes
  )
}
