import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitOrderUpdated } from '@/lib/events'
import { checkFeatureAccess } from '@/lib/featureGate'
import { orderQuerySchema } from '@/lib/validations/api'
import { z } from 'zod'

function isPrismaServiceUnavailableError(error: unknown): error is { code: string } {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' && ['P1001', 'P1002', 'P1012', 'P2021', 'P2022'].includes(code)
}

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can access this endpoint')
    }

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const vendorIdParam = searchParams.get('vendorId')

    const vendorId = isAdmin ? vendorIdParam : session.user.id

    if (!vendorId) {
      return errorResponse(new Error('vendorId query parameter is required for admin access'), 400)
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
    // Keep the dashboard usable when production schema is temporarily out-of-sync.
    if (isPrismaServiceUnavailableError(error)) {
      return successResponse({
        orders: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
      })
    }
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can update orders')
    }

    const body = await request.json()
    const orderId = body?.orderId as string | undefined
    const statusRaw = body?.status as string | undefined
    const driverIdRaw = body?.driverId
    const hasDriverField = driverIdRaw !== undefined
    const hasStatus = typeof statusRaw === 'string' && statusRaw.trim().length > 0

    if (!orderId || (!hasStatus && !hasDriverField)) {
      return errorResponse(
        new Error('orderId and at least one of status or driverId are required'),
        400,
      )
    }

    try {
      z.string().cuid().parse(orderId)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      select: { id: true, status: true, vendorId: true },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (isVendor && order.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only update your own orders')
    }

    const vendorScopeId =
      order.vendorId || (session.user.role === 'VENDOR' ? session.user.id : null)

    const updateData: Record<string, unknown> = {}

    if (hasStatus) {
      const allowedStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED']
      const normalizedStatus = statusRaw!.toUpperCase()
      if (!allowedStatuses.includes(normalizedStatus)) {
        return errorResponse(
          new Error(`Invalid status for vendor. Allowed statuses: ${allowedStatuses.join(', ')}`),
          400,
        )
      }
      updateData.status = normalizedStatus
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
        default:
          break
      }
    }

    if (hasDriverField) {
      if (!vendorScopeId) {
        return errorResponse(new Error('Order has no vendor for driver assignment'), 400)
      }
      const fleetOk = await checkFeatureAccess(vendorScopeId, 'driverFleetManagement')
      if (!fleetOk) {
        throw new ForbiddenError('Driver assignment requires Professional plan or higher')
      }

      let nextDriverId: string | null
      if (driverIdRaw === null || driverIdRaw === '') {
        nextDriverId = null
      } else if (typeof driverIdRaw === 'string' && driverIdRaw.length > 0) {
        const link = await prisma.driverVendorConnection.findFirst({
          where: {
            vendorId: vendorScopeId,
            driverId: driverIdRaw,
            status: 'ACCEPTED',
            availableForDispatch: true,
          },
          select: { id: true },
        })
        if (!link) {
          throw new ForbiddenError('Driver is not connected to your store')
        }
        nextDriverId = driverIdRaw
      } else {
        return errorResponse(new Error('driverId must be string, empty, or null'), 400)
      }

      updateData.driverId = nextDriverId
      updateData.assignedAt = nextDriverId ? new Date() : null
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(new Error('No valid updates'), 400)
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData as Record<string, unknown>,
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

    console.log('[API] Vendor updated order:', orderId, updateData)
    emitOrderUpdated(updatedOrder)

    return successResponse({ order: updatedOrder })
  } catch (error) {
    console.error('[API] Error updating order:', error)
    return errorResponse(error)
  }
}
