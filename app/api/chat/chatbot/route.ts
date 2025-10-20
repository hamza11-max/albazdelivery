import { type NextRequest, NextResponse } from "next/server"

const chatbotResponses: Record<string, string> = {
  "how to track order":
    "You can track your order in real-time from the tracking page. Go to your active orders and click on the order to see live updates.",
  "delivery time": "Standard delivery takes 30-45 minutes. Express delivery is available in select areas.",
  "payment methods": "We accept cash on delivery and card payments. Wallet payments coming soon!",
  "refund policy": "Refunds are processed within 3-5 business days. Contact support for assistance.",
  "contact support": "You can reach our support team 24/7 through the chat feature or by calling +213 555 000 000.",
  "how to order": "Browse categories, select a store, add items to cart, and checkout. You can pay cash on delivery.",
  "minimum order": "Minimum order value is 500 DZD for most stores.",
  "delivery fee": "Delivery fee is 500 DZD for standard delivery.",
  "promo codes": "Check our promotions page for active promo codes and discounts.",
  account: "You can manage your account settings, addresses, and payment methods in your profile.",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 })
    }

    const lowerMessage = message.toLowerCase()

    // Find matching response
    let response = "I'm not sure about that. Please contact our support team for assistance."

    for (const [key, value] of Object.entries(chatbotResponses)) {
      if (lowerMessage.includes(key)) {
        response = value
        break
      }
    }

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error processing chatbot message:", error)
    return NextResponse.json({ success: false, error: "Failed to process message" }, { status: 500 })
  }
}
