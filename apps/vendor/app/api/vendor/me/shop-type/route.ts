import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import {
  successResponse,
  errorResponse,
  UnauthorizedError,
  ForbiddenError,
} from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { asRootRequest } from "@/lib/next-request-bridge"
import { resolveOwnerShopType } from "@/root/lib/shop-type-access"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    if (!session?.user?.id) throw new UnauthorizedError()
    const role = String(session.user.role || "")
    if (role !== "VENDOR" && role !== "ADMIN") {
      throw new ForbiddenError("Vendor only")
    }
    const shopType = await resolveOwnerShopType(session.user.id)
    return successResponse({ shopType })
  } catch (e: unknown) {
    const err = e as { statusCode?: number }
    return errorResponse(e, err?.statusCode || 500)
  }
}
