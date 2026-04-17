import { NextRequest } from "next/server"
import { auth } from "@/root/lib/auth"
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

    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()
    if (String(session.user.role).toUpperCase() !== "ADMIN") {
      throw new ForbiddenError("Only admins can access passkeys")
    }

    const searchParams = request.nextUrl.searchParams
    const status = String(searchParams.get("status") || "").toUpperCase()
    const limit = Math.min(Number(searchParams.get("limit") || 100), 300)
    const where: Record<string, unknown> = {}
    if (status && ["PENDING", "APPROVED", "REJECTED", "REVOKED"].includes(status)) {
      where.status = status
    }
    where.user = { role: "VENDOR" }

    const credentials = await prisma.webAuthnCredential.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number.isFinite(limit) ? limit : 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    })

    return successResponse({
      credentials: credentials.map((credential) => ({
        id: credential.id,
        userId: credential.userId,
        vendor: credential.user,
        credentialId: credential.credentialId,
        nickname: credential.nickname,
        status: credential.status,
        deviceType: credential.deviceType,
        transports: credential.transports,
        backedUp: credential.backedUp,
        approvedAt: credential.approvedAt,
        approvedBy: credential.approvedBy,
        revokedAt: credential.revokedAt,
        revokedBy: credential.revokedBy,
        revocationReason: credential.revocationReason,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
        lastUsedAt: credential.lastUsedAt,
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
