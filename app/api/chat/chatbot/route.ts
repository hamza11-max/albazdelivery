import { type NextRequest } from "next/server"
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import generateText from '@/lib/llm'

const chatbotResponses: Record<string, string> = {
  "how to track order":
    "You can track your order in real-time from the tracking page. Go to your active orders and click on the order to see live updates.",
  "delivery time": "Standard delivery takes 30-45 minutes. Express delivery is available in select areas.",
  "payment methods": "We accept cash on delivery and card payments. Wallet payments are available!",
  "refund policy": "Refunds are processed within 3-5 business days. Contact support for assistance.",
  "contact support": "You can reach our support team 24/7 through the chat feature or by calling +213 555 000 000.",
  "how to order": "Browse categories, select a store, add items to cart, and checkout. You can pay cash on delivery.",
  "minimum order": "Minimum order value is 500 DZD for most stores.",
  "delivery fee": "Delivery fee is 500 DZD for standard delivery.",
  "promo codes": "Check our promotions page for active promo codes and discounts.",
  account: "You can manage your account settings, addresses, and payment methods in your profile.",
}

const chatbotMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message too long'),
})

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // Optional authentication - chatbot can be used by anyone, but logged-in users get priority
    const session = await auth()

    const body = await request.json()
    const validatedData = chatbotMessageSchema.parse(body)
    const { message } = validatedData

    const lowerMessage = message.toLowerCase()

    // Find matching response
    // Default fallback
    let response = "I'm not sure about that. Please contact our support team for assistance."
    let matchedKeyword: string | null = null

    for (const [key, value] of Object.entries(chatbotResponses)) {
      if (lowerMessage.includes(key)) {
        response = value
        matchedKeyword = key
        break
      }
    }

    // If an LLM provider is configured, prefer calling it (falls back to static responses)
    try {
      if (process.env.LLM_PROVIDER) {
        // Use the raw user message as a prompt; callers may wish to improve prompt engineering later
        const llmText = await generateText(message, { model: process.env.LLM_DEFAULT_MODEL })
        if (llmText && llmText.trim().length > 0) {
          response = llmText.trim()
          matchedKeyword = matchedKeyword || 'llm'
        }
      }
    } catch (err) {
      // Log LLM errors but do not block — fall back to static response
      console.error('[LLM] Error generating response (falling back):', err)
    }

    return successResponse({
      response,
      matchedKeyword,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id || null,
    })
  } catch (error) {
    console.error("[API] Error processing chatbot message:", error)
    return errorResponse(error)
  }
}
