import { NextRequest } from "next/server"
import { auth } from "@/root/lib/auth"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, UnauthorizedError, ValidationError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }
    await applyRateLimit(request, rateLimitConfigs.strict)

    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const params = await context.params
    const id = String(params.id || "")
    if (!id) throw new ValidationError("Credential id is required")

    const credential = await prisma.webAuthnCredential.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, revokedAt: true },
    })
    if (!credential || credential.userId !== session.user.id) {
      throw new ValidationError("Credential not found")
    }

    await prisma.webAuthnCredential.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy: session.user.id,
        revocationReason: "self_revoked",
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
