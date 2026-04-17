import { NextRequest } from "next/server"
import { auth } from "@/root/lib/auth"
import { prisma } from "@/root/lib/prisma"
import { errorResponse, ForbiddenError, UnauthorizedError, ValidationError, successResponse } from "@/root/lib/errors"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"
import { csrfProtection } from "@/apps/admin/lib/csrf"
import { logPasskeyAuditEvent } from "@/root/lib/webauthn/audit"

type AdminPasskeyAction = "approve" | "reject" | "revoke"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    if (!isWebAuthnPasskeysEnabled()) {
      throw new ForbiddenError("WebAuthn passkeys are disabled")
    }
    await applyRateLimit(request, rateLimitConfigs.strict)

    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()
    if (String(session.user.role).toUpperCase() !== "ADMIN") {
      throw new ForbiddenError("Only admins can moderate passkeys")
    }

    const params = await context.params
    const credentialId = String(params.id || "").trim()
    if (!credentialId) {
      throw new ValidationError("Credential id is required")
    }

    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || "").toLowerCase() as AdminPasskeyAction
    const reason = String(body?.reason || "").trim() || null

    if (!["approve", "reject", "revoke"].includes(action)) {
      throw new ValidationError("action must be one of approve/reject/revoke")
    }

    const credential = await prisma.webAuthnCredential.findUnique({
      where: { id: credentialId },
      select: { id: true, userId: true, status: true },
    })
    if (!credential) throw new ValidationError("Credential not found")

    const now = new Date()
    if (action === "approve") {
      await prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedBy: session.user.id,
          revokedAt: null,
          revokedBy: null,
          revocationReason: null,
        },
      })
      await logPasskeyAuditEvent({
        request,
        action: "ADMIN_APPROVED",
        actorUserId: session.user.id,
        targetUserId: credential.userId,
        credentialId: credential.id,
        details: { previousStatus: credential.status },
      })
    } else if (action === "reject") {
      await prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: {
          status: "REJECTED",
          revokedAt: now,
          revokedBy: session.user.id,
          revocationReason: reason || "Rejected by admin",
        },
      })
      await logPasskeyAuditEvent({
        request,
        action: "ADMIN_REJECTED",
        actorUserId: session.user.id,
        targetUserId: credential.userId,
        credentialId: credential.id,
        details: { reason },
      })
    } else {
      await prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: {
          status: "REVOKED",
          revokedAt: now,
          revokedBy: session.user.id,
          revocationReason: reason || "Revoked by admin",
        },
      })
      await logPasskeyAuditEvent({
        request,
        action: "ADMIN_REVOKED",
        actorUserId: session.user.id,
        targetUserId: credential.userId,
        credentialId: credential.id,
        details: { reason, previousStatus: credential.status },
      })
    }

    return successResponse({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
