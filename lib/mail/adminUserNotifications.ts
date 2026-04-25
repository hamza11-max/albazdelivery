import {
  sendTransactionalEmail,
  type SendTransactionalEmailResult,
} from "./sendTransactionalEmail"

function skipNoEmail(): Promise<SendTransactionalEmailResult> {
  return Promise.resolve({
    ok: true,
    skipped: true,
    reason: "no_email",
  })
}

/** Password was changed by admin; never include the new password in email. */
export function notifyUserPasswordResetByAdmin(params: {
  to: string | null | undefined
  name: string | null
}) {
  if (!params.to?.trim()) return skipNoEmail()
  const subject = "Your Albaz account password was updated"
  const text = [
    `Hello${params.name ? ` ${params.name}` : ""},`,
    "",
    "An administrator has reset the password on your Albaz account.",
    "",
    "For your security, we do not send the new password by email. Use the credentials your administrator gives you to sign in.",
    "",
    "If you did not expect this change, contact support immediately.",
  ].join("\n")
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}

export function notifyUserSuspended(params: {
  to: string | null | undefined
  name: string | null
  reason?: string | null
}) {
  if (!params.to?.trim()) return skipNoEmail()
  const subject = "Your Albaz account has been suspended"
  const lines = [
    `Hello${params.name ? ` ${params.name}` : ""},`,
    "",
    "Your Albaz account has been suspended.",
  ]
  if (params.reason?.trim()) {
    lines.push("", `Reason: ${params.reason.trim()}`)
  }
  lines.push("", "If you believe this is a mistake, contact support.")
  return sendTransactionalEmail({ to: params.to.trim(), subject, text: lines.join("\n") })
}

export function notifyUserUnsuspended(params: {
  to: string | null | undefined
  name: string | null
}) {
  if (!params.to?.trim()) return skipNoEmail()
  const subject = "Your Albaz account is active again"
  const text = [
    `Hello${params.name ? ` ${params.name}` : ""},`,
    "",
    "Your Albaz account has been reactivated. You can sign in again.",
    "",
    "If you did not expect this message, contact support.",
  ].join("\n")
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}
