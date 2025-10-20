import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emitOrderCreated, emitNotificationSent } from "@/lib/events"
import type { Order, OrderItem, PaymentMethod, PaymentStatus } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      storeId,
      items,
      deliveryAddress,
      city,
      customerPhone,
      paymentMethod,
      scheduledDate,
      scheduledTime,
      whoPays,
      isPackageDelivery,
      packageDescription,
      recipientName,
      recipientPhone,
    } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const deliveryFee = 500

    const order: Order = {
      id: `order-${Date.now()}`,
      customerId,
      storeId,
      items: items as OrderItem[],
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status: "pending",
      paymentMethod: paymentMethod || "cash",
      deliveryAddress,
      city,
      customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      scheduledTime,
      whoPays: whoPays || "customer",
      isPackageDelivery: isPackageDelivery || false,
      packageDescription,
      recipientName,
      recipientPhone,
    }

    const createdOrder = db.createOrder(order)

    // Emit order created event for real-time updates
    emitOrderCreated(createdOrder)

    // Create vendor notification
    const vendorNotification = {
      id: `notif-${Date.now()}`,
      recipientId: `vendor-${storeId}`,
      recipientRole: "vendor" as const,
      type: "order_status" as const,
      title: "New Order Received",
      message: `New order #${createdOrder.id} from customer`,
      relatedOrderId: createdOrder.id,
      actionUrl: `/vendor?orderId=${createdOrder.id}`,
      isRead: false,
      createdAt: new Date(),
    }

    db.createNotification(vendorNotification)
    emitNotificationSent(vendorNotification)

    // Create payment record if not cash
    if (paymentMethod !== "cash") {
      const payment = {
        id: `payment-${Date.now()}`,
        orderId: createdOrder.id,
        customerId,
        amount: createdOrder.total,
        method: paymentMethod as PaymentMethod,
        status: "pending" as PaymentStatus,
        createdAt: new Date(),
      }
      db.createPayment(payment)
    }

    return NextResponse.json({ success: true, order: createdOrder }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
