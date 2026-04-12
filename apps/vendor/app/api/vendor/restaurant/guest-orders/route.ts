import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { listGuestOrders, updateGuestOrderStatus } from "@/lib/guest-orders-store"
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
    const status = request.nextUrl.searchParams.get("status")?.trim()
    let orders = listGuestOrders()
    if (status && ["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
      orders = orders.filter((o) => o.status === status)
    }
    return successResponse({ orders })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
})

export async function PATCH(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    assertVendor(session)
    const body = patchSchema.parse(await request.json())
    const res = updateGuestOrderStatus(body.id, body.status)
    if (!res.ok) return errorResponse(new Error(res.error), 400)
    return successResponse({ order: res.order })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
