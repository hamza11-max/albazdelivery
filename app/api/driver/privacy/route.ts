import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emitDriverPrivacyChanged } from "@/lib/events"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isActive } = body
    const driverId = session.user.id

    // Update driver location privacy settings
    const location = await prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        isActive: isActive
      },
      create: {
        driverId,
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0,
        isActive: isActive
      }
    })

    // Emit privacy changed event
    emitDriverPrivacyChanged(driverId, !isActive)

    return NextResponse.json({
      success: true,
      isActive: location.isActive
    })
  } catch (error) {
    console.error("[DRIVER] Error updating privacy settings:", error)
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const driverId = session.user.id

    // Get driver location privacy settings
    const location = await prisma.driverLocation.findUnique({
      where: { driverId },
      select: { isActive: true }
    })

    return NextResponse.json({
      isActive: location?.isActive ?? false
    })
  } catch (error) {
    console.error("[DRIVER] Error fetching privacy settings:", error)
    return NextResponse.json({ error: "Failed to fetch privacy settings" }, { status: 500 })
  }
}