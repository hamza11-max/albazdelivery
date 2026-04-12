import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { addExpense, listExpenses } from "@/lib/vendor-accounting-local"
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
    return successResponse({ expenses: listExpenses() })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}

const postSchema = z.object({
  amount: z.number().nonnegative(),
  category: z.string().min(1).max(80),
  note: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(asRootRequest(request), rateLimitConfigs.api)
    const session = await getSessionFromRequest(request as never)
    assertVendor(session)
    const body = postSchema.parse(await request.json())
    const row = addExpense(body)
    return successResponse({ expense: row })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
