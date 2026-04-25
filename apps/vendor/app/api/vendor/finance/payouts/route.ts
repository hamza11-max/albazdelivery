import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/root/lib/prisma"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      throw new ForbiddenError("Only vendors and admins can view payouts")
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
      throw new ForbiddenError("You can only access your own payouts")
    }

    if (!vendorId) {
      return successResponse({ payouts: [] })
    }

    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { id: true, role: true },
    })
    if (!vendor || vendor.role !== "VENDOR") {
      return errorResponse(new Error("Vendor not found"), 404)
    }

    const rows = await prisma.vendorPayout.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    })

    const payouts = rows.map((r) => ({
      id: r.id,
      period: r.periodLabel,
      gross: r.grossAmount,
      fees: r.feesAmount,
      net: r.netAmount,
      status: r.status,
      eta: r.etaLabel,
    }))

    return successResponse({ payouts })
  } catch (error) {
    return errorResponse(error)
  }
}
