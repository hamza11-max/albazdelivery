import { NextRequest } from "next/server"
import { generateAuthenticationOptions } from "@simplewebauthn/server"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, ValidationError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { challengeExpiryDate, getClientMetadata } from "@/root/lib/webauthn/common"
import { getWebAuthnRpId } from "@/root/lib/webauthn/config"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"
import { logPasskeyAuditEvent } from "@/root/lib/webauthn/audit"
import { cleanupExpiredWebAuthnState } from "@/root/lib/webauthn/maintenance"

const PHONE_REGEX = /^0[567]\d{8}$/

function normalizeIdentifier(input: string): { email?: string; phone?: string } {
  const value = String(input || "").trim()
  if (PHONE_REGEX.test(value)) return { phone: value }
  return { email: value.toLowerCase() }
}

export async function POST(request: NextRequest) {
  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }

    await applyRateLimit(request, rateLimitConfigs.auth)
    await cleanupExpiredWebAuthnState()
    const body = await request.json().catch(() => ({}))
    const identifier = String(body?.identifier || "").trim()
    if (!identifier) throw new ValidationError("identifier is required")

    const normalized = normalizeIdentifier(identifier)
    const user = await prisma.user.findFirst({
      where: {
        ...normalized,
        status: "APPROVED",
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      throw new ValidationError("No approved account found for this identifier")
    }

    const credentials = await prisma.webAuthnCredential.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
        revokedAt: null,
      },
      select: { credentialId: true },
    })

    if (credentials.length === 0) {
      throw new ValidationError("No approved passkeys found for this account")
    }

    const options = await generateAuthenticationOptions({
      rpID: getWebAuthnRpId(),
      timeout: 60_000,
      userVerification: "preferred",
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        type: "public-key",
      })),
    })
    const { ipAddress, userAgent } = getClientMetadata(request)
    const challengeRow = await prisma.webAuthnChallenge.create({
      data: {
        userId: user.id,
        challenge: options.challenge,
        purpose: "AUTHENTICATION",
        expiresAt: challengeExpiryDate(),
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      },
    })

    await logPasskeyAuditEvent({
      request,
      action: "AUTH_OPTIONS_ISSUED",
      targetUserId: user.id,
      details: { challengeId: challengeRow.id, allowCredentials: credentials.length },
    })

    return successResponse({
      challengeId: challengeRow.id,
      options,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
