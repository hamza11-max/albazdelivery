import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { addTable, deleteTable, listTables } from "@/lib/guest-orders-store"
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
    return successResponse({ tables: listTables() })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}

const postSchema = z.object({ label: z.string().min(1).max(120) })

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    assertVendor(session)
    const body = postSchema.parse(await request.json())
    const table = addTable(body.label)
    return successResponse({ table })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    assertVendor(session)
    const id = request.nextUrl.searchParams.get("id")?.trim()
    if (!id) return errorResponse(new Error("Missing id"), 400)
    const ok = deleteTable(id)
    if (!ok) return errorResponse(new Error("Table not found"), 404)
    return successResponse({ success: true })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
