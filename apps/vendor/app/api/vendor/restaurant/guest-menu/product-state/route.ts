import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getGuestMenuHiddenIds, setGuestMenuProductHidden } from "@/lib/guest-menu-product-state"
import { asRootRequest } from "@/lib/next-request-bridge"
import { assertVendorFeature } from "@/root/lib/shop-type-access"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    await assertVendorFeature(session, "dineTablesUi")
    return successResponse({ hiddenIds: getGuestMenuHiddenIds() })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}

const patchSchema = z.object({
  productId: z.string().min(1),
  hidden: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    await assertVendorFeature(session, "dineTablesUi")
    const body = patchSchema.parse(await request.json())
    const hiddenIds = setGuestMenuProductHidden(body.productId, body.hidden)
    return successResponse({ hiddenIds })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
