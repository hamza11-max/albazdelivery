import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitOrderAssigned } from "@/lib/events"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, driverId } = body

    if (!orderId || !driverId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing orderId or driverId",
        },
        { status: 400 },
      )
    }

    const order = db.getOrder(orderId)

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "ready") {
      return NextResponse.json({ success: false, error: "Order is not ready for pickup" }, { status: 400 })
    }

    if (order.driverId) {
      return NextResponse.json({ success: false, error: "Order already assigned to a driver" }, { status: 400 })
    }

    const updatedOrder = db.assignDriver(orderId, driverId)

    console.log("[v0] Driver accepted delivery:", orderId)

    if (updatedOrder) {
      emitOrderAssigned(updatedOrder, driverId)
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error("[v0] Error accepting delivery:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to accept delivery",
      },
      { status: 500 },
    )
  }
}
