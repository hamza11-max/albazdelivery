import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { UnauthorizedError, ForbiddenError } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { exportAccountingCsv } from "@/lib/vendor-accounting-local"
import { asRootRequest } from "@/lib/next-request-bridge"
import { NextResponse } from "next/server"

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
    const now = Date.now()
    const from = Number(request.nextUrl.searchParams.get("fromMs")) || now - 30 * 24 * 60 * 60 * 1000
    const to = Number(request.nextUrl.searchParams.get("toMs")) || now
    const csv = exportAccountingCsv(from, to)
    const filename = `albaz-accounting-${from}-${to}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: e?.statusCode || 500 })
  }
}
