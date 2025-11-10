import { type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return errorResponse(new Error('orderId is required'), 400)
    }

    // Validate orderId format
    try {
      z.string().cuid().parse(orderId)
    } catch {
      return errorResponse(new Error('Invalid order ID format'), 400)
    }

    // Get the order with driver information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerId: true,
        vendorId: true,
        driverId: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            photoUrl: true,
            driverLocation: true
          }
        }
      }
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Check authorization - only customer, vendor, driver of this order, or admin can access
    const userId = session.user.id
    const userRole = session.user.role
    
    if (
      userRole !== "ADMIN" && 
      userId !== order.customerId && 
      userId !== order.vendorId && 
      userId !== order.driverId
    ) {
      throw new ForbiddenError('Not authorized to track this order')
    }

    // If order has no driver assigned yet
    if (!order.driverId) {
      return successResponse({ 
        order,
        tracking: null,
        message: "Driver not yet assigned to this order"
      })
    }

    // Get driver's current location
    const driverLocation = await prisma.driverLocation.findUnique({
      where: { driverId: order.driverId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            photoUrl: true,
          },
        },
      },
    })

    // Get recent location history (last 10 points)
    const locationHistory = await prisma.locationHistory.findMany({
      where: { 
        driverLocationId: driverLocation?.id,
        orderId: orderId
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    return successResponse({
      order,
      tracking: {
        currentLocation: driverLocation,
        locationHistory: locationHistory.reverse(), // Send in chronological order
        lastUpdated: driverLocation?.updatedAt,
        driver: driverLocation?.driver,
      }
    })
  } catch (error) {
    console.error("[ORDER] Error tracking order:", error)
    return errorResponse(error)
  }
}