import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { adminOrdersSchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access all orders')
    }

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const vendorIdParam = searchParams.get('vendorId')
    const customerIdParam = searchParams.get('customerId')
    const driverIdParam = searchParams.get('driverId')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Validate IDs if provided
    if (vendorIdParam) {
      try {
        z.string().cuid().parse(vendorIdParam)
      } catch {
        return errorResponse(new Error('Invalid vendor ID format'), 400)
      }
    }
    if (customerIdParam) {
      try {
        z.string().cuid().parse(customerIdParam)
      } catch {
        return errorResponse(new Error('Invalid customer ID format'), 400)
      }
    }
    if (driverIdParam) {
      try {
        z.string().cuid().parse(driverIdParam)
      } catch {
        return errorResponse(new Error('Invalid driver ID format'), 400)
      }
    }

    // Build where clause
    const where: any = {}

    if (statusParam) {
      where.status = statusParam.toUpperCase()
    }
    if (vendorIdParam) {
      where.vendorId = vendorIdParam
    }
    if (customerIdParam) {
      where.customerId = customerIdParam
    }
    if (driverIdParam) {
      where.driverId = driverIdParam
    }
    if (startDateParam || endDateParam) {
      where.createdAt = {}
      if (startDateParam) {
        where.createdAt.gte = new Date(startDateParam)
      }
      if (endDateParam) {
        where.createdAt.lte = new Date(endDateParam)
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
              email: true,
              phone: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
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
    console.error('[API] Error fetching all orders:', error)
    return errorResponse(error)
  }
}
