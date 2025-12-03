import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { emitNotificationSent } from '@/lib/events'
import { z } from 'zod'

// GET /api/vendors/drivers - Get connected drivers and pending requests for vendor
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'VENDOR') {
      throw new ForbiddenError('Only vendors can access this endpoint')
    }

    // Get all connections for this vendor
    const connections = await prisma.driverVendorConnection.findMany({
      where: { vendorId: session.user.id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            photoUrl: true,
            vehicleType: true,
            licenseNumber: true,
            city: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then ACCEPTED, then REJECTED
        { requestedAt: 'desc' },
      ],
    })

    const connectedDrivers = connections
      .filter((c) => c.status === 'ACCEPTED')
      .map((c) => ({
        id: c.id,
        connectionId: c.id,
        driver: c.driver,
        connectedAt: c.respondedAt || c.updatedAt,
      }))

    const pendingRequests = connections
      .filter((c) => c.status === 'PENDING')
      .map((c) => ({
        id: c.id,
        connectionId: c.id,
        driver: c.driver,
        requestedAt: c.requestedAt,
      }))

    const rejectedRequests = connections
      .filter((c) => c.status === 'REJECTED')
      .map((c) => ({
        id: c.id,
        connectionId: c.id,
        driver: c.driver,
        rejectedAt: c.respondedAt || c.updatedAt,
      }))

    return successResponse({
      connectedDrivers,
      pendingRequests,
      rejectedRequests,
    })
  } catch (error) {
    console.error('[API] Error fetching drivers:', error)
    return errorResponse(error)
  }
}

// POST /api/vendors/drivers - Accept or reject connection request
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'VENDOR') {
      throw new ForbiddenError('Only vendors can accept/reject connections')
    }

    const body = await request.json()
    const schema = z.object({
      connectionId: z.string().cuid('Invalid connection ID'),
      action: z.enum(['accept', 'reject'], {
        errorMap: () => ({ message: 'Action must be accept or reject' }),
      }),
    })

    const { connectionId, action } = schema.parse(body)

    // Get connection and verify it belongs to this vendor
    const connection = await prisma.driverVendorConnection.findUnique({
      where: { id: connectionId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!connection) {
      return errorResponse(new Error('Connection request not found'), 404)
    }

    if (connection.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only respond to your own connection requests')
    }

    if (connection.status !== 'PENDING') {
      return errorResponse(new Error('Connection request already responded to'), 400)
    }

    // Update connection status
    const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    const updatedConnection = await prisma.driverVendorConnection.update({
      where: { id: connectionId },
      data: {
        status,
        respondedAt: new Date(),
      },
    })

    // Create notification for driver
    const notification = await prisma.notification.create({
      data: {
        recipientId: connection.driverId,
        recipientRole: 'DRIVER',
        type: 'SYSTEM',
        title:
          action === 'accept'
            ? 'Connection Request Accepted'
            : 'Connection Request Rejected',
        message:
          action === 'accept'
            ? `${session.user.name} accepted your connection request`
            : `${session.user.name} rejected your connection request`,
        actionUrl: '/driver?tab=vendors',
      },
    })

    emitNotificationSent(notification)

    return successResponse({
      connection: updatedConnection,
      message: `Connection request ${action === 'accept' ? 'accepted' : 'rejected'}`,
    })
  } catch (error) {
    console.error('[API] Error responding to connection:', error)
    return errorResponse(error)
  }
}

