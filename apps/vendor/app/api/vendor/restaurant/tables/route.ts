import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { addTable, deleteTable, listTables } from "@/lib/guest-orders-store"
import { asRootRequest } from "@/lib/next-request-bridge"
import { assertVendorFeature } from "@/root/lib/shop-type-access"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    await assertVendorFeature(session, "dineTablesUi")
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
    await assertVendorFeature(session, "dineTablesUi")
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
    await assertVendorFeature(session, "dineTablesUi")
    const id = request.nextUrl.searchParams.get("id")?.trim()
    if (!id) return errorResponse(new Error("Missing id"), 400)
    const ok = deleteTable(id)
    if (!ok) return errorResponse(new Error("Table not found"), 404)
    return successResponse({ success: true })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
