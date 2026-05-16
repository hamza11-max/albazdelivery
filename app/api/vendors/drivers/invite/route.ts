import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import { inviteDriverForVendor } from "@/lib/vendor-invite-driver"
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
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "VENDOR") {
      throw new ForbiddenError("Only vendors can invite drivers")
    }

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.parse(body)

    const result = await inviteDriverForVendor({
      vendorId: session.user.id,
      vendorDisplayName: session.user.name ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
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
