import { NextRequest, NextResponse } from "next/server"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { errorResponse, type ApiResponse } from "@/root/lib/errors"
import { getTableById } from "@/lib/guest-orders-store"
import { listProductsForGuestMenu } from "@/lib/guest-menu-products"
import { asRootRequest } from "@/lib/next-request-bridge"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.relaxed)
    const tableId = request.nextUrl.searchParams.get("tableId")?.trim()
    if (!tableId || !getTableById(tableId)) {
      return errorResponse(new Error("Invalid or missing table"), 400)
    }
    const products = listProductsForGuestMenu()
    const body: ApiResponse<{ products: typeof products }> = {
      success: true,
      data: { products },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }
    return NextResponse.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    })
  } catch (e: any) {
    const status = e?.statusCode === 429 ? 429 : 500
    return errorResponse(e, status)
  }
}
