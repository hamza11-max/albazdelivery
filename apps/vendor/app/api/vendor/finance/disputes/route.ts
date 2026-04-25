import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/root/lib/prisma"
import {
  successResponse,
  errorResponse,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"

const createDisputeSchema = z.object({
  payoutId: z.string().min(1),
  orderId: z.string().optional(),
  reason: z.string().min(5),
  amount: z.number().nonnegative(),
  /** When session is ADMIN, target vendor for the dispute */
  vendorId: z.string().cuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      throw new ForbiddenError("Only vendors and admins can view disputes")
    }

    const vendorIdParam = request.nextUrl.searchParams.get("vendorId")
    let vendorId: string | null =
      session.user.role === "VENDOR" ? session.user.id : null
    if (vendorIdParam) {
      try {
        z.string().cuid().parse(vendorIdParam)
      } catch {
        return errorResponse(new Error("Invalid vendor ID format"), 400)
      }
      vendorId = vendorIdParam
    }

    if (session.user.role === "VENDOR" && vendorId !== session.user.id) {
      throw new ForbiddenError("You can only access your own disputes")
    }

    if (!vendorId) {
      return successResponse({ disputes: [] })
    }

    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { id: true, role: true },
    })
    if (!vendor || vendor.role !== "VENDOR") {
      return errorResponse(new Error("Vendor not found"), 404)
    }

    const rows = await prisma.vendorDispute.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const disputes = rows.map((r) => ({
      id: r.id,
      payoutId: r.payoutId,
      orderId: r.orderId ?? "",
      reason: r.reason,
      amount: r.amount,
      status: r.status,
    }))

    return successResponse({ disputes })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      throw new ForbiddenError("Only vendors and admins can submit disputes")
    }

    const body = await request.json()
    const parsed = createDisputeSchema.parse(body)

    let targetVendorId = session.user.id
    if (session.user.role === "ADMIN") {
      if (!parsed.vendorId) {
        throw new ValidationError("vendorId is required for admin dispute submission")
      }
      targetVendorId = parsed.vendorId
    }

    const payout = await prisma.vendorPayout.findFirst({
      where: { id: parsed.payoutId, vendorId: targetVendorId },
      select: { id: true },
    })
    if (!payout) {
      throw new ValidationError("Payout not found")
    }

    const vendor = await prisma.user.findUnique({
      where: { id: targetVendorId },
      select: { id: true, role: true },
    })
    if (!vendor || vendor.role !== "VENDOR") {
      throw new ValidationError("Vendor not found")
    }

    const dispute = await prisma.vendorDispute.create({
      data: {
        vendorId: targetVendorId,
        payoutId: parsed.payoutId,
        orderId: parsed.orderId?.trim() || null,
        reason: parsed.reason.trim(),
        amount: parsed.amount,
        status: "OPEN",
      },
    })

    return successResponse({
      dispute: {
        id: dispute.id,
        payoutId: dispute.payoutId,
        orderId: dispute.orderId ?? "",
        reason: dispute.reason,
        amount: dispute.amount,
        status: dispute.status,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
