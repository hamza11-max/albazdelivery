import { NextRequest } from "next/server"
import { prisma } from "@/root/lib/prisma"
import {
  successResponse,
  errorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { checkFeatureAccess } from "@/root/lib/featureGate"
import { z } from "zod"

/**
 * PATCH /api/vendors/drivers/:driverId/status
 * Vendor toggles dispatch availability for an **accepted** connected driver.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { driverId: string } },
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "VENDOR") {
      throw new ForbiddenError("Only vendors can update driver status")
    }

    const driverId = String(params.driverId || "").trim()
    if (!driverId) {
      return errorResponse(new Error("driverId is required"), 400)
    }

    const fleetOk = await checkFeatureAccess(session.user.id, "driverFleetManagement")
    if (!fleetOk) {
      throw new ForbiddenError("Driver dispatch controls require Professional plan or higher")
    }

    const body = await request.json().catch(() => ({}))
    const parsed = z
      .object({
        availableForDispatch: z.boolean(),
      })
      .parse(body)

    const connection = await prisma.driverVendorConnection.findFirst({
      where: {
        vendorId: session.user.id,
        driverId,
        status: "ACCEPTED",
      },
    })

    if (!connection) {
      throw new NotFoundError("Driver connection")
    }

    const updated = await prisma.driverVendorConnection.update({
      where: { id: connection.id },
      data: { availableForDispatch: parsed.availableForDispatch },
    })

    return successResponse({
      connectionId: updated.id,
      driverId: updated.driverId,
      availableForDispatch: updated.availableForDispatch,
    })
  } catch (error) {
    console.error("[API] PATCH vendor driver status:", error)
    return errorResponse(error)
  }
}
