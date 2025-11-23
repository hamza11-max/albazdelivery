import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { emitOrderUpdated } from '@/root/lib/events'
import { orderQuerySchema } from '@/root/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // DISABLED for Electron app (no authentication)
    // const session = await auth()
    // if (!session?.user) {
    //   throw new UnauthorizedError()
    // }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can access this endpoint')
    }

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const vendorIdParam = searchParams.get('vendorId')

    let vendorId = isAdmin ? vendorIdParam : null // session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !vendorId) {
      const firstVendor = await prisma.user.findFirst({
        where: { role: 'VENDOR', status: 'APPROVED' },
        select: { id: true },
      })
      if (firstVendor) {
        vendorId = firstVendor.id
      }
    }

    if (!vendorId) {
      return errorResponse(new Error('No vendor found. Please create a vendor first.'), 400)
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build where clause
    const where: any = { vendorId }

    if (statusParam) {
      // Validate status
      try {
        orderQuerySchema.pick({ status: true }).parse({ status: statusParam })
        where.status = statusParam.toUpperCase()
      } catch {
        return errorResponse(new Error('Invalid order status'), 400)
      }
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
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
              email: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleType: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
            },
          },
          ...(isAdmin
            ? {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
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
    console.error('[API] Error fetching vendor orders:', error)
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // DISABLED for Electron app (no authentication)
    // const session = await auth()
    // if (!session?.user) {
    //   throw new UnauthorizedError()
    // }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can update orders')
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return errorResponse(new Error('orderId and status are required'), 400)
    }

    // Validate orderId format
    try {
      z.string().cuid().parse(orderId)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    // Validate status
    const allowedStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED']
    const normalizedStatus = status.toUpperCase()
    if (!allowedStatuses.includes(normalizedStatus)) {
      return errorResponse(new Error(`Invalid status for vendor. Allowed statuses: ${allowedStatuses.join(', ')}`), 400)
    }

    // Verify order belongs to vendor
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      select: { id: true, status: true, vendorId: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // DISABLED for Electron app
    // if (isVendor && order.vendorId !== session.user.id) {
    //   throw new ForbiddenError('You can only update your own orders')
    // }

    // Prepare update data with timestamps
    const updateData: any = { status: normalizedStatus }

    // Add appropriate timestamp based on status
    switch (normalizedStatus) {
      case 'ACCEPTED':
        updateData.acceptedAt = new Date()
        break
      case 'PREPARING':
        updateData.preparingAt = new Date()
        break
      case 'READY':
        updateData.readyAt = new Date()
        break
      case 'CANCELLED':
        updateData.cancelledAt = new Date()
        break
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
            email: true,
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
    })

    console.log('[API] Vendor updated order:', orderId, '->', normalizedStatus)
    emitOrderUpdated(updatedOrder)

    return successResponse({ order: updatedOrder })
  } catch (error) {
    console.error('[API] Error updating order:', error)
    return errorResponse(error)
  }
}
