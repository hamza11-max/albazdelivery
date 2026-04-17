import { NextRequest } from "next/server"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, ValidationError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { getClientMetadata, normalizeCredentialId } from "@/root/lib/webauthn/common"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"
import { issuePasskeyAuthGrant } from "@/root/lib/webauthn/grants"
import { logPasskeyAuditEvent } from "@/root/lib/webauthn/audit"
import { cleanupExpiredWebAuthnState } from "@/root/lib/webauthn/maintenance"
import { getWebAuthnOrigin, getWebAuthnRpId } from "@/root/lib/webauthn/config"

export async function POST(request: NextRequest) {
  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }

    await applyRateLimit(request, rateLimitConfigs.auth)
    await cleanupExpiredWebAuthnState()
    const body = await request.json().catch(() => ({}))
    const challengeId = String(body?.challengeId || "").trim()
    const authCredential = body?.credential
    const credentialId = normalizeCredentialId(authCredential?.id || body?.credentialId)

    if (!challengeId || !credentialId || !authCredential) {
      throw new ValidationError("challengeId and credential are required")
    }

    const challenge = await prisma.webAuthnChallenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        userId: true,
        challenge: true,
        purpose: true,
        expiresAt: true,
        consumedAt: true,
      },
    })

    if (!challenge || challenge.purpose !== "AUTHENTICATION" || !challenge.userId) {
      throw new ValidationError("Invalid authentication challenge")
    }
    if (challenge.consumedAt || challenge.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("Authentication challenge expired")
    }

    const credential = await prisma.webAuthnCredential.findUnique({
      where: { credentialId },
      select: {
        id: true,
        credentialId: true,
        publicKey: true,
        counter: true,
        transports: true,
        userId: true,
        status: true,
        revokedAt: true,
      },
    })

    if (
      !credential ||
      credential.userId !== challenge.userId ||
      credential.status !== "APPROVED" ||
      !!credential.revokedAt
    ) {
      await logPasskeyAuditEvent({
        request,
        action: "AUTH_FAILED",
        targetUserId: challenge.userId,
        details: { reason: "invalid_credential_state" },
      })
      throw new ValidationError("Passkey is not approved for this account")
    }

    const verification = await verifyAuthenticationResponse({
      response: authCredential,
      expectedChallenge: challenge.challenge,
      expectedOrigin: getWebAuthnOrigin(),
      expectedRPID: getWebAuthnRpId(),
      authenticator: {
        credentialID: isoBase64URL.toBuffer(credential.credentialId),
        credentialPublicKey: isoBase64URL.toBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports,
      },
      requireUserVerification: true,
    })
    if (!verification.verified) {
      await logPasskeyAuditEvent({
        request,
        action: "AUTH_FAILED",
        targetUserId: challenge.userId,
        details: { reason: "verification_failed" },
      })
      throw new ValidationError("Passkey authentication failed")
    }

    const { ipAddress, userAgent } = getClientMetadata(request)

    await prisma.$transaction([
      prisma.webAuthnChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
      prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: {
          lastUsedAt: new Date(),
          counter: verification.authenticationInfo.newCounter,
        },
      }),
    ])

    const passkeyToken = await issuePasskeyAuthGrant({
      userId: challenge.userId,
      ipAddress,
      userAgent,
    })

    await logPasskeyAuditEvent({
      request,
      action: "AUTH_SUCCESS",
      targetUserId: challenge.userId,
      credentialId: credential.id,
      details: { challengeId: challenge.id },
    })

    return successResponse({
      passkeyToken,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
