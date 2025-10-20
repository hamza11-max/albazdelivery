import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitOrderUpdated, emitOrderAssigned, emitNotificationSent } from "@/lib/events"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, driverId } = body

    const order = db.updateOrderStatus(id, status, driverId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (status === "assigned" && driverId) {
      emitOrderAssigned(order, driverId)

      // Create notification for driver
      const driverNotification = {
        id: `notif-${Date.now()}`,
        recipientId: driverId,
        recipientRole: "driver" as const,
        type: "delivery_update" as const,
        title: "New Delivery Assigned",
        message: `Delivery #${order.id} assigned to you`,
        relatedOrderId: order.id,
        actionUrl: `/driver?orderId=${order.id}`,
        isRead: false,
        createdAt: new Date(),
      }
      db.createNotification(driverNotification)
      emitNotificationSent(driverNotification)
    } else {
      emitOrderUpdated(order)
    }

    // Create notification for customer
    const statusMessages: Record<string, string> = {
      accepted: "Your order has been accepted",
      preparing: "Your order is being prepared",
      ready: "Your order is ready for pickup",
      in_delivery: "Your order is on the way",
      delivered: "Your order has been delivered",
    }

    if (statusMessages[status]) {
      const customerNotification = {
        id: `notif-${Date.now()}`,
        recipientId: order.customerId,
        recipientRole: "customer" as const,
        type: "order_status" as const,
        title: "Order Update",
        message: statusMessages[status],
        relatedOrderId: order.id,
        actionUrl: `/tracking?orderId=${order.id}`,
        isRead: false,
        createdAt: new Date(),
      }
      db.createNotification(customerNotification)
      emitNotificationSent(customerNotification)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("[v0] Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
