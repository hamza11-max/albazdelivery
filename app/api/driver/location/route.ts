import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitDriverLocationUpdated } from "@/lib/events"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, accuracy, heading, speed, isActive, status, currentOrderId } = body
    const driverId = session.user.id

    // Update driver location
    const location = await prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        isActive: isActive !== undefined ? isActive : true,
        status: status || "online",
        currentOrderId,
        updatedAt: new Date(),
      },
      create: {
        driverId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        isActive: isActive !== undefined ? isActive : true,
        status: status || "online",
        currentOrderId,
      },
    })

    // Store location history
    await prisma.locationHistory.create({
      data: {
        driverLocationId: location.id,
        latitude,
        longitude,
        orderId: currentOrderId,
      }
    })

    // Emit event for real-time updates
    emitDriverLocationUpdated(driverId, { 
      lat: latitude, 
      lng: longitude,
      heading,
      speed,
      status,
      orderId: currentOrderId,
      timestamp: new Date()
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("[DRIVER] Error updating driver location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const driverId = searchParams.get("driverId")
    const orderId = searchParams.get("orderId")

    if (!driverId && !orderId) {
      return NextResponse.json({ error: "driverId or orderId is required" }, { status: 400 })
    }

    let location;
    
    if (orderId) {
      // Get driver location by order ID
      location = await prisma.driverLocation.findFirst({
        where: { currentOrderId: orderId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleType: true,
              photoUrl: true
            }
          }
        }
      })
    } else {
      // Get driver location by driver ID
      location = await prisma.driverLocation.findUnique({
        where: { driverId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleType: true,
              photoUrl: true
            }
          }
        }
      })
    }

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("[DRIVER] Error fetching driver location:", error)
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 })
  }
}
