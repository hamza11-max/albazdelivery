import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const wallet = await prisma.wallet.findUnique({
      where: { customerId: session.user.id },
      select: { balance: true },
    })

    return successResponse({ balance: wallet?.balance ?? 0 })
  } catch (error) {
    return errorResponse(error)
  }
}
