import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitDriverLocationUpdated } from "@/lib/events"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, latitude, longitude, accuracy, heading, speed } = body

    const location = db.updateDriverLocation(driverId, {
      driverId,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      updatedAt: new Date(),
    })

    emitDriverLocationUpdated(driverId, { lat: latitude, lng: longitude })

    return NextResponse.json(location)
  } catch (error) {
    console.error("[v0] Error updating driver location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "driverId is required" }, { status: 400 })
    }

    const location = db.getDriverLocation(driverId)
    return NextResponse.json(location || { error: "Location not found" })
  } catch (error) {
    console.error("[v0] Error fetching driver location:", error)
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 })
  }
}
