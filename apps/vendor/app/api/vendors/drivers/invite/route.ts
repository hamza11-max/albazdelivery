import { NextRequest } from "next/server"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { inviteDriverForVendor } from "@/root/lib/vendor-invite-driver"
import {
  resolveVendorOwnerContextId,
  assertStaffPermission,
} from "@/root/lib/vendor-staff-access"
import { z } from "zod"

const bodySchema = z
  .object({
    email: z.string().email().optional().nullable(),
    phone: z.string().min(3).optional().nullable(),
  })
  .refine((v) => Boolean(v.email?.trim()) || Boolean(v.phone?.trim()), {
    message: "Provide email or phone",
  })

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "VENDOR") {
      throw new ForbiddenError("Only vendors can invite drivers")
    }

    const ownerId = await resolveVendorOwnerContextId(session.user.id)
    await assertStaffPermission(session.user.id, ownerId, "orders.edit")

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.parse(body)

    const result = await inviteDriverForVendor({
      vendorId: ownerId,
      vendorDisplayName: session.user.name,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      request,
    })

    return successResponse({
      connectionId: result.connectionId,
      created: result.created,
      alreadyPending: result.alreadyPending,
    })
  } catch (error) {
    console.error("[API] vendor invite driver:", error)
    return errorResponse(error)
  }
}
