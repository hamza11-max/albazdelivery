import { NextRequest } from "next/server"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { successResponse, errorResponse } from "@/root/lib/errors"
import { appendGuestOrder } from "@/lib/guest-orders-store"
import { validateGuestCartItems } from "@/lib/guest-menu-products"
import { asRootRequest } from "@/lib/next-request-bridge"
import { z } from "zod"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  tableId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
  note: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.strict)
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return errorResponse(new Error("Invalid order payload"), 400)
    }
    const cartCheck = validateGuestCartItems(
      parsed.data.items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
    )
    if (!cartCheck.ok) {
      return errorResponse(new Error(cartCheck.error), 409)
    }
    const res = appendGuestOrder(parsed.data)
    if (!res.ok) {
      return errorResponse(new Error(res.error), 400)
    }
    return successResponse({ orderId: res.order.id, total: res.order.total })
  } catch (e: any) {
    const status = e?.statusCode === 429 ? 429 : 500
    return errorResponse(e, status)
  }
}
