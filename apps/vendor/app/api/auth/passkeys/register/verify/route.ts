import { NextRequest } from "next/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { auth } from "@/root/lib/auth"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, UnauthorizedError, ValidationError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { normalizeCredentialId } from "@/root/lib/webauthn/common"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"
import { logPasskeyAuditEvent } from "@/root/lib/webauthn/audit"
import { cleanupExpiredWebAuthnState } from "@/root/lib/webauthn/maintenance"
import { getWebAuthnOrigin, getWebAuthnRpId } from "@/root/lib/webauthn/config"

export async function POST(request: NextRequest) {
  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }

    await applyRateLimit(request, rateLimitConfigs.strict)
    await cleanupExpiredWebAuthnState()
    const session = await auth()

    if (!session?.user?.id) throw new UnauthorizedError()

    const body = await request.json().catch(() => ({}))
    const challengeId = String(body?.challengeId || "").trim()
    const registrationCredential = body?.credential
    const credentialId = normalizeCredentialId(registrationCredential?.id || body?.credentialId)
    const nickname = String(body?.nickname || "").trim() || null

    if (!challengeId || !credentialId || !registrationCredential) {
      throw new ValidationError("challengeId and credential are required")
    }

    const challenge = await prisma.webAuthnChallenge.findUnique({
      where: { id: challengeId },
      select: { id: true, userId: true, challenge: true, purpose: true, expiresAt: true, consumedAt: true },
    })

    if (!challenge || challenge.userId !== session.user.id || challenge.purpose !== "REGISTRATION") {
      throw new ValidationError("Invalid registration challenge")
    }

    if (challenge.consumedAt || challenge.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("Registration challenge expired")
    }

    await prisma.webAuthnChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    })

    const verification = await verifyRegistrationResponse({
      response: registrationCredential,
      expectedChallenge: challenge.challenge,
      expectedOrigin: getWebAuthnOrigin(),
      expectedRPID: getWebAuthnRpId(),
      requireUserVerification: true,
    })
    if (!verification.verified || !verification.registrationInfo) {
      throw new ValidationError("Passkey registration verification failed")
    }

    const transports = verification.registrationInfo.credential.transports || []
    const publicKey = isoBase64URL.fromBuffer(verification.registrationInfo.credential.publicKey)
    const counter = verification.registrationInfo.credential.counter

    const storedCredential = await prisma.webAuthnCredential.upsert({
      where: { credentialId },
      create: {
        userId: session.user.id,
        credentialId,
        publicKey,
        counter,
        transports,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        nickname: nickname || undefined,
        status: "PENDING",
      },
      update: {
        userId: session.user.id,
        publicKey,
        counter,
        transports,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        nickname: nickname || undefined,
        status: "PENDING",
        approvedAt: null,
        approvedBy: null,
        revokedAt: null,
        revokedBy: null,
        revocationReason: null,
      },
      select: {
        id: true,
        credentialId: true,
        status: true,
        createdAt: true,
      },
    })

    await logPasskeyAuditEvent({
      request,
      action: "REGISTRATION_COMPLETED_PENDING",
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      credentialId: storedCredential.id,
      details: {
        credentialId: storedCredential.credentialId,
        transports,
        nickname,
        verified: verification.verified,
      },
    })

    return successResponse({
      credential: storedCredential,
      message: "Passkey registered and pending admin approval",
    })
  } catch (error) {
    return errorResponse(error)
  }
}
