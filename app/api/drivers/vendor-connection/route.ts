import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import { auth } from "@/lib/auth"
import { emitNotificationSent } from "@/lib/events"
import { z } from "zod"

/**
 * Driver accepts/rejects a **vendor-invited** pending connection (`VENDOR_INVITED`).
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "DRIVER") {
      throw new ForbiddenError("Only drivers can respond")
    }

    const body = await request.json()
    const schema = z.object({
      connectionId: z.string().min(1),
      action: z.enum(["accept", "reject"]),
    })
    const { connectionId, action } = schema.parse(body)

    const connection = await prisma.driverVendorConnection.findUnique({
      where: { id: connectionId },
      include: {
        vendor: {
          select: { id: true, name: true },
        },
      },
    })

    if (!connection) {
      return errorResponse(new ValidationError("Connection not found"), 404)
    }

    if (connection.driverId !== session.user.id) {
      throw new ForbiddenError("This invitation is not for you")
    }

    if (connection.status !== "PENDING") {
      throw new ValidationError("This request has already been handled")
    }

    if (connection.connectionSource !== "VENDOR_INVITED") {
      throw new ValidationError("Use vendor dashboard to approve driver-initiated requests")
    }

    const status = action === "accept" ? "ACCEPTED" : "REJECTED"
    const updated = await prisma.driverVendorConnection.update({
      where: { id: connectionId },
      data: {
        status,
        respondedAt: new Date(),
      },
    })

    const notification = await prisma.notification.create({
      data: {
        recipientId: connection.vendorId,
        recipientRole: "VENDOR",
        type: "SYSTEM",
        title:
          action === "accept"
            ? "Driver accepted your invitation"
            : "Driver declined your invitation",
        message:
          action === "accept"
            ? `${session.user.name} accepted your invitation`
            : `${session.user.name} declined your invitation`,
        actionUrl: "/vendor?tab=drivers",
      },
    })
    emitNotificationSent(notification)

    return successResponse({
      connection: updated,
      message:
        action === "accept"
          ? "Connected to vendor"
          : "Invitation declined",
    })
  } catch (error) {
    console.error("[API] driver vendor-connection:", error)
    return errorResponse(error)
  }
}
