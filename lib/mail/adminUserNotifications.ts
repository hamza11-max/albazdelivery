import {
  sendTransactionalEmail,
  type SendTransactionalEmailResult,
} from "./sendTransactionalEmail"
import { EMAIL_TEMPLATE_KEYS } from "./default-email-templates"
import { buildTransactionalEmailContent } from "./transactional-email-from-db"

function skipNoEmail(): Promise<SendTransactionalEmailResult> {
  return Promise.resolve({
    ok: true,
    skipped: true,
    reason: "no_email",
  })
}

/** Password was changed by admin; never include the new password in email. */
export async function notifyUserPasswordResetByAdmin(params: {
  to: string | null | undefined
  name: string | null
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const namePart = params.name?.trim() ? ` ${params.name.trim()}` : ""
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.admin_password_reset,
    vars: { namePart },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}

export async function notifyUserSuspended(params: {
  to: string | null | undefined
  name: string | null
  reason?: string | null
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const namePart = params.name?.trim() ? ` ${params.name.trim()}` : ""
  const reasonBlock = params.reason?.trim()
    ? `\n\nMotif : ${params.reason.trim()}\n`
    : "\n"
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.admin_account_suspended,
    vars: { namePart, reasonBlock },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}

export async function notifyUserUnsuspended(params: {
  to: string | null | undefined
  name: string | null
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const namePart = params.name?.trim() ? ` ${params.name.trim()}` : ""
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.admin_account_unsuspended,
    vars: { namePart },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}
