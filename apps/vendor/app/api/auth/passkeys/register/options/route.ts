import { NextRequest } from "next/server"
import { generateRegistrationOptions } from "@simplewebauthn/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import { auth } from "@/root/lib/auth"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, UnauthorizedError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { challengeExpiryDate, encodeUserHandle, getClientMetadata } from "@/root/lib/webauthn/common"
import { getWebAuthnRpId, getWebAuthnRpName } from "@/root/lib/webauthn/config"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"
import { logPasskeyAuditEvent } from "@/root/lib/webauthn/audit"
import { cleanupExpiredWebAuthnState } from "@/root/lib/webauthn/maintenance"

export async function POST(request: NextRequest) {
  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }

    await applyRateLimit(request, rateLimitConfigs.strict)
    await cleanupExpiredWebAuthnState()
    const session = await auth()

    if (!session?.user?.id) throw new UnauthorizedError()
    if (session.user.status !== "APPROVED") {
      throw new ForbiddenError("Only approved users can register passkeys")
    }

    const existingCredentials = await prisma.webAuthnCredential.findMany({
      where: {
        userId: session.user.id,
        status: { notIn: ["REJECTED", "REVOKED"] },
      },
      select: { credentialId: true },
    })

    const options = await generateRegistrationOptions({
      rpName: getWebAuthnRpName(),
      rpID: getWebAuthnRpId(),
      userID: encodeUserHandle(session.user.id),
      userName: session.user.email,
      userDisplayName: session.user.name,
      timeout: 60_000,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      excludeCredentials: existingCredentials.map((credential) => ({
        id: isoBase64URL.toBuffer(credential.credentialId),
        type: "public-key",
      })),
    })

    const { ipAddress, userAgent } = getClientMetadata(request)

    const challengeRow = await prisma.webAuthnChallenge.create({
      data: {
        userId: session.user.id,
        challenge: options.challenge,
        purpose: "REGISTRATION",
        expiresAt: challengeExpiryDate(),
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      },
    })

    await logPasskeyAuditEvent({
      request,
      action: "REGISTRATION_OPTIONS_ISSUED",
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      details: { challengeId: challengeRow.id },
    })

    return successResponse({
      challengeId: challengeRow.id,
      options,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
