import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/root/lib/get-session-from-request"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, UnauthorizedError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"

export async function GET(request: NextRequest) {
  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) throw new UnauthorizedError()

    const credentials = await prisma.webAuthnCredential.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        credentialId: true,
        status: true,
        nickname: true,
        deviceType: true,
        transports: true,
        createdAt: true,
        approvedAt: true,
        revokedAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return successResponse({ credentials })
  } catch (error) {
    return errorResponse(error)
  }
}
