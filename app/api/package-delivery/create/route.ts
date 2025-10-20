import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { Order } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      fromLocation,
      toLocation,
      packageDescription,
      recipientName,
      recipientPhone,
      senderPhone,
      vehicleType,
      paymentMethod,
      whoPays,
      deliveryOption,
      total,
    } = body

    // Create a package delivery order
    const order: Order = {
      id: `pkg-${Date.now()}`,
      customerId,
      storeId: 0, // Package delivery doesn't have a store
      items: [
        {
          productId: 0,
          quantity: 1,
          price: total,
          productName: packageDescription || "Package Delivery",
        },
      ],
      subtotal: total,
      deliveryFee: 0,
      total,
      status: "ready", // Ready for driver pickup
      paymentMethod,
      deliveryAddress: toLocation,
      city: "Tamanrasset",
      customerPhone: senderPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
      packageDescription,
      recipientName,
      recipientPhone,
      vehicleType,
      whoPays,
      deliveryOption,
      isPackageDelivery: true,
    }

    // Create the order in database
    db.createOrder(order)

    // Return success response
    return NextResponse.json({
      success: true,
      order,
      message: "Package delivery created successfully",
    })
  } catch (error) {
    console.error("[v0] Error creating package delivery:", error)
    return NextResponse.json({ success: false, error: "Failed to create package delivery" }, { status: 500 })
  }
}
