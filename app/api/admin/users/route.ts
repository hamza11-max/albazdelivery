import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

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
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Validate pagination parameters
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100) // Max 100 per page

    // Validate role if provided
    if (role && !['CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN'].includes(role.toUpperCase())) {
      return errorResponse(new Error('Invalid role'), 400)
    }

    // Validate status if provided
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return errorResponse(new Error('Invalid status'), 400)
    }

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

// POST /api/admin/users - Create user (admin only, e.g. vendor)
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can create users')
    }

    const body = await request.json()
    const { name, email, phone, password, role = 'VENDOR', shopType, address, city } = body || {}

    if (!name || !email || !phone || !password) {
      throw new ValidationError('name, email, phone and password are required')
    }

    const emailLower = String(email).toLowerCase().trim()
    const phoneTrim = String(phone).trim()

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailLower }, { phone: phoneTrim }],
      },
    })
    if (existing) {
      throw new ValidationError(existing.email === emailLower ? 'Email already registered' : 'Phone already registered')
    }

    const hashedPassword = await hashPassword(String(password))

    const newUser = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: emailLower,
          phone: phoneTrim,
          password: hashedPassword,
          role: (String(role).toUpperCase() || 'VENDOR') as 'VENDOR',
          status: 'APPROVED',
          shopType: shopType || null,
          address: address || null,
          city: city || null,
        },
      })

      if (user.role === 'VENDOR' && shopType) {
        await tx.store.create({
          data: {
            name: user.name,
            type: shopType,
            categoryId: 1,
            vendorId: user.id,
            address: address || 'To be updated',
            city: city || 'Algiers',
            phone: user.phone,
            deliveryTime: '30-45 min',
            isActive: true,
          },
        })
      }

      return user
    })

    return successResponse({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      message: 'User created successfully',
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
