import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { listExpenses, listOfflineSalesInRange, summarizeSales } from "@/lib/vendor-accounting-local"
import { asRootRequest } from "@/lib/next-request-bridge"

export const dynamic = "force-dynamic"

type ExpenseRow = { createdAt: number; amount: number | string }

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
    const now = Date.now()
    const from = Number(request.nextUrl.searchParams.get("fromMs")) || now - 30 * 24 * 60 * 60 * 1000
    const to = Number(request.nextUrl.searchParams.get("toMs")) || now
    const sales = listOfflineSalesInRange(from, to)
    const salesSummary = summarizeSales(sales)
    const expenses = listExpenses().filter((e: ExpenseRow) => e.createdAt >= from && e.createdAt <= to)
    const expenseTotal = expenses.reduce((s: number, e: ExpenseRow) => s + (Number(e.amount) || 0), 0)
    return successResponse({
      fromMs: from,
      toMs: to,
      salesSummary,
      expenses,
      expenseTotal,
      sales,
    })
  } catch (e: any) {
    return errorResponse(e, e?.statusCode || 500)
  }
}
