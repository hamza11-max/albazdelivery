import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitOrderUpdated } from "@/lib/events"

// GET /api/orders/[id] - Get a specific order
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = db.getOrder(params.id)

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, driverId } = body

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 })
    }

    const updatedOrder = db.updateOrderStatus(params.id, status, driverId)

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    console.log("[v0] Order status updated:", updatedOrder.id, "->", status)

    emitOrderUpdated(updatedOrder)

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
  }
}
