import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { paymentHistorySchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const customerIdParam = searchParams.get('customerId')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Determine customerId - customers see their own, admins can specify
    let customerId = session.user.id
    if (session.user.role === 'ADMIN' && customerIdParam) {
      customerId = customerIdParam
      // Validate customerId format
      try {
        z.string().cuid().parse(customerId)
      } catch {
        return errorResponse(new Error('Invalid customer ID format'), 400)
      }
    } else if (session.user.role !== 'ADMIN' && customerIdParam && customerIdParam !== session.user.id) {
      throw new ForbiddenError('Cannot access other user payment history')
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build where clause
    const where: any = {
      order: {
        customerId,
      },
    }

    // Add date filters if provided
    if (startDateParam || endDateParam) {
      where.createdAt = {}
      if (startDateParam) {
        where.createdAt.gte = new Date(startDateParam)
      }
      if (endDateParam) {
        where.createdAt.lte = new Date(endDateParam)
      }
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true,
              store: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return successResponse({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Payment history error:', error)
    return errorResponse(error)
  }
}
