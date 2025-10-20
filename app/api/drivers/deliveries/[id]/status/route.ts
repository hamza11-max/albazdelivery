import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitOrderUpdated, emitOrderDelivered } from "@/lib/events"

// PATCH /api/drivers/deliveries/[id]/status - Update delivery status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, driverId } = body

    if (!status || !driverId) {
      return NextResponse.json({ success: false, error: "status and driverId are required" }, { status: 400 })
    }

    const order = db.getOrder(params.id)

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (order.driverId !== driverId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Order not assigned to this driver" },
        { status: 403 },
      )
    }

    const allowedStatuses = ["in_delivery", "delivered"]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status for driver" }, { status: 400 })
    }

    const updatedOrder = db.updateOrderStatus(params.id, status)

    console.log("[v0] Driver updated delivery status:", params.id, "->", status)

    if (updatedOrder) {
      if (status === "delivered") {
        emitOrderDelivered(updatedOrder)
      } else {
        emitOrderUpdated(updatedOrder)
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("[v0] Error updating delivery status:", error)
    return NextResponse.json({ success: false, error: "Failed to update delivery status" }, { status: 500 })
  }
}
