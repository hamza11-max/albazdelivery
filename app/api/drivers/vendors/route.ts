import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// GET /api/drivers/vendors - Get available vendors for driver
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can access this endpoint')
    }

    // Get all vendors with their stores
    const vendors = await prisma.user.findMany({
      where: {
        role: 'VENDOR',
        status: 'APPROVED',
      },
      include: {
        stores: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            image: true,
          },
        },
      },
    })

    // Get driver's connections to check status
    const connections = await prisma.driverVendorConnection.findMany({
      where: { driverId: session.user.id },
      select: {
        vendorId: true,
        status: true,
      },
    })

    const connectionMap = new Map(
      connections.map((c) => [c.vendorId, c.status])
    )

    // Format vendors with connection status
    const vendorsWithStatus = vendors
      .filter((v) => v.stores.length > 0) // Only vendors with active stores
      .map((vendor) => {
        const connectionStatus = connectionMap.get(vendor.id) || null
        return {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          photoUrl: vendor.photoUrl,
          city: vendor.city,
          address: vendor.address,
          stores: vendor.stores,
          connectionStatus, // null = not requested, PENDING, ACCEPTED, REJECTED
        }
      })

    return successResponse({ vendors: vendorsWithStatus })
  } catch (error) {
    console.error('[API] Error fetching vendors:', error)
    return errorResponse(error)
  }
}

// POST /api/drivers/vendors - Request connection to a vendor
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'DRIVER') {
      throw new ForbiddenError('Only drivers can request connections')
    }

    const body = await request.json()
    const schema = z.object({
      vendorId: z.string().cuid('Invalid vendor ID'),
    })

    const { vendorId } = schema.parse(body)

    // Verify vendor exists and is approved
    const vendor = await prisma.user.findUnique({
      where: {
        id: vendorId,
        role: 'VENDOR',
        status: 'APPROVED',
      },
    })

    if (!vendor) {
      return errorResponse(new Error('Vendor not found or not approved'), 404)
    }

    // Check if connection already exists
    const existingConnection = await prisma.driverVendorConnection.findUnique({
      where: {
        driverId_vendorId: {
          driverId: session.user.id,
          vendorId,
        },
      },
    })

    if (existingConnection) {
      if (existingConnection.status === 'ACCEPTED') {
        return errorResponse(new Error('Already connected to this vendor'), 400)
      }
      if (existingConnection.status === 'PENDING') {
        return errorResponse(new Error('Connection request already pending'), 400)
      }
      if (existingConnection.status === 'REJECTED') {
        // Allow re-requesting after rejection
        await prisma.driverVendorConnection.update({
          where: { id: existingConnection.id },
          data: {
            status: 'PENDING',
            requestedAt: new Date(),
            respondedAt: null,
          },
        })
      }
    } else {
      // Create new connection request
      await prisma.driverVendorConnection.create({
        data: {
          driverId: session.user.id,
          vendorId,
          status: 'PENDING',
        },
      })
    }

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        recipientId: vendorId,
        recipientRole: 'VENDOR',
        type: 'SYSTEM',
        title: 'New Driver Connection Request',
        message: `${session.user.name} wants to connect with you`,
        actionUrl: `/vendor?tab=drivers`,
      },
    })

    return successResponse({ message: 'Connection request sent' })
  } catch (error) {
    console.error('[API] Error requesting connection:', error)
    return errorResponse(error)
  }
}

