import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
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
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
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
      return NextResponse.json({ error: "Not authorized to track this order" }, { status: 403 })
    }

    // If order has no driver assigned yet
    if (!order.driverId) {
      return NextResponse.json({ 
        order,
        tracking: null,
        message: "Driver not yet assigned to this order"
      })
    }

    // Get driver's current location
    const driverLocation = await prisma.driverLocation.findUnique({
      where: { driverId: order.driverId },
    })

    // Get recent location history (last 10 points)
    const locationHistory = await prisma.LocationHistory.findMany({
      where: { 
        driverLocation: { driverId: order.driverId },
        orderId: orderId
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    return NextResponse.json({
      order,
      tracking: {
        currentLocation: driverLocation,
        locationHistory: locationHistory.reverse(), // Send in chronological order
        lastUpdated: driverLocation?.updatedAt
      }
    })
  } catch (error) {
    console.error("[ORDER] Error tracking order:", error)
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 })
  }
}