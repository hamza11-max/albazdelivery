import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Check authorization (admin only)
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access this resource')
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}
    if (role) {
      where.role = role.toUpperCase()
    }
    if (status) {
      where.status = status.toUpperCase()
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get paginated users
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
        shopType: true,
        vehicleType: true,
        createdAt: true,
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
    return errorResponse(error)
  }
}
