import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getGuestMenuHiddenIds, setGuestMenuProductHidden } from "@/lib/guest-menu-product-state"
import { asRootRequest } from "@/lib/next-request-bridge"
import { z } from "zod"

export const dynamic = "force-dynamic"

function assertVendor(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session?.user?.id) throw new UnauthorizedError()
  const role = String(session.user.role || "")
  if (role !== "VENDOR" && role !== "ADMIN") throw new ForbiddenError("Vendor only")
}

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    assertVendor(session)
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
    assertVendor(session)
    const body = patchSchema.parse(await request.json())
    const hiddenIds = setGuestMenuProductHidden(body.productId, body.hidden)
    return successResponse({ hiddenIds })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
