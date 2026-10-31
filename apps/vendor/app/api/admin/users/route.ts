import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { getSessionFromRequest } from '@/root/lib/get-session-from-request'

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access this resource')
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    if (role && !['CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN'].includes(role.toUpperCase())) {
      return errorResponse(new Error('Invalid role'), 400)
    }

    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return errorResponse(new Error('Invalid status'), 400)
    }

    const where: any = {}
    if (role) {
      where.role = role.toUpperCase()
    }
    if (status) {
      where.status = status.toUpperCase()
    }

    const total = await prisma.user.count({ where })

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        city: true,
        address: true,
        licenseNumber: true,
        vehicleType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return successResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Admin Users GET error:', error)
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return errorResponse(error)
    }

    try {
      const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100)

      return successResponse({
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      })
    } catch {
      return successResponse({
        users: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      })
    }
  }
}
