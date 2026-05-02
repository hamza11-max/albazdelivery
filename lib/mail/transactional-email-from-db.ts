import { prisma } from "@/root/lib/prisma"
import {
  ensureDefaultEmailTemplates,
  getStaticEmailTemplateFallback,
} from "./default-email-templates"
import { renderEmailPlaceholders } from "./render-email-placeholders"

export type TransactionalEmailLocale = "fr" | "ar"

/**
 * Loads subject/body from `EmailTemplate` (French or Arabic), with static fallbacks.
 * Ensures default rows exist once per process (idempotent).
 */
export async function buildTransactionalEmailContent(options: {
  key: string
  locale?: TransactionalEmailLocale
  vars: Record<string, string | null | undefined>
}): Promise<{ subject: string; text: string }> {
  await ensureDefaultEmailTemplates()

  const locale = options.locale ?? "fr"
  const row = await prisma.emailTemplate.findUnique({
    where: { key: options.key },
  })
  const fb = getStaticEmailTemplateFallback(options.key)

  let subjectTpl =
    locale === "ar" && row?.subjectAr?.trim()
      ? row.subjectAr
      : row?.subjectFr?.trim() || fb?.subjectFr || ""
  let bodyTpl =
    locale === "ar" && row?.bodyAr?.trim()
      ? row.bodyAr
      : row?.bodyFr?.trim() || fb?.bodyFr || ""

  if (!subjectTpl && fb) subjectTpl = fb.subjectFr
  if (!bodyTpl && fb) bodyTpl = fb.bodyFr

  return {
    subject: renderEmailPlaceholders(subjectTpl, options.vars),
    text: renderEmailPlaceholders(bodyTpl, options.vars),
  }
}
