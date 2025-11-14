import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET /api/admin/registration-requests - Get pending registration requests
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
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      status: status?.toUpperCase() || 'PENDING',
    }

    const requests = await prisma.registrationRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ requests })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/admin/registration-requests - Approve or reject registration request
export async function POST(request: NextRequest) {
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
      throw new ForbiddenError('Only admins can perform this action')
    }

    const body = await request.json()
    const { requestId, action } = body

    if (!requestId || !action) {
      return errorResponse(new Error('Missing required fields: requestId, action'), 400)
    }

    if (!['approve', 'reject'].includes(action)) {
      return errorResponse(new Error('Invalid action. Must be "approve" or "reject"'), 400)
    }

    // Get registration request
    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    })

    if (!registrationRequest) {
      throw new NotFoundError('Registration request')
    }

    if (registrationRequest.status !== 'PENDING') {
      return errorResponse(new Error('This request has already been processed'), 400)
    }

    if (action === 'approve') {
      // Create user from registration request
      const user = await prisma.$transaction(async (tx: any) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            name: registrationRequest.name,
            email: registrationRequest.email,
            phone: registrationRequest.phone,
            password: registrationRequest.password, // Already hashed
            role: registrationRequest.role,
            status: 'APPROVED',
            licenseNumber: registrationRequest.licenseNumber,
            shopType: registrationRequest.shopType,
          },
        })

        // Update registration request
        await tx.registrationRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          },
        })

        // Create store for vendors
        if (registrationRequest.role === 'VENDOR' && registrationRequest.shopType) {
          await tx.store.create({
            data: {
              name: registrationRequest.name,
              type: registrationRequest.shopType,
              categoryId: 1, // Default category - update based on shopType
              vendorId: newUser.id,
              address: 'To be updated',
              city: 'Algiers',
              phone: registrationRequest.phone,
              deliveryTime: '30-45 min',
              isActive: true,
            },
          })
        }

        // Create driver performance record
        if (registrationRequest.role === 'DRIVER') {
          await tx.driverPerformance.create({
            data: {
              driverId: newUser.id,
              totalDeliveries: 0,
              averageDeliveryTime: 0,
              onTimePercentage: 100,
              rating: 5.0,
              earnings: 0,
            },
          })
        }

        return newUser
      })

      return successResponse(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          message: 'User approved successfully',
        },
        200
      )
    } else {
      // Reject registration request
      await prisma.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      })

      return successResponse(
        {
          message: 'Registration request rejected',
        },
        200
      )
    }
  } catch (error) {
    return errorResponse(error)
  }
}
