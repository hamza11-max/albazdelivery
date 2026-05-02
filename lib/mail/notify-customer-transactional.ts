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

/** Uses admin-editable `EmailTemplate` key `order_placed` ({{name}}, {{orderId}}). */
export async function sendOrderPlacedCustomerEmail(params: {
  to: string | null | undefined
  name: string | null | undefined
  orderId: string
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.order_placed,
    vars: {
      name: params.name?.trim() ?? "",
      orderId: params.orderId,
    },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}

/** Uses admin-editable `EmailTemplate` key `welcome_customer` ({{name}}). */
export async function sendWelcomeCustomerEmail(params: {
  to: string | null | undefined
  name: string | null | undefined
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.welcome_customer,
    vars: { name: params.name?.trim() ?? "" },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}

/** Uses admin-editable `welcome_vendor` ({{name}}). */
export async function sendWelcomeVendorEmail(params: {
  to: string | null | undefined
  name: string | null | undefined
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.welcome_vendor,
    vars: { name: params.name?.trim() ?? "" },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}

/** Uses admin-editable `welcome_driver` ({{name}}). */
export async function sendWelcomeDriverEmail(params: {
  to: string | null | undefined
  name: string | null | undefined
}): Promise<SendTransactionalEmailResult> {
  if (!params.to?.trim()) return skipNoEmail()
  const { subject, text } = await buildTransactionalEmailContent({
    key: EMAIL_TEMPLATE_KEYS.welcome_driver,
    vars: { name: params.name?.trim() ?? "" },
  })
  return sendTransactionalEmail({ to: params.to.trim(), subject, text })
}
