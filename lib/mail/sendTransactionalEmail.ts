import nodemailer from "nodemailer"

export type SendTransactionalEmailResult =
  | { ok: true; skipped?: false; messageId?: string }
  | { ok: true; skipped: true; reason: "smtp_not_configured" | "no_email" }
  | { ok: false; error: string }

export function notificationEmailStatus(
  r: SendTransactionalEmailResult,
): "sent" | "skipped" | "failed" {
  if (r.ok === false) return "failed"
  if ("skipped" in r && r.skipped) return "skipped"
  return "sent"
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
  )
}

/**
 * Sends a single transactional email via SMTP env (see ENV_TEMPLATE.md).
 * If SMTP is not configured, logs and returns skipped — callers should not treat that as failure.
 */
export async function sendTransactionalEmail(options: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<SendTransactionalEmailResult> {
  if (!isSmtpConfigured()) {
    console.warn("[mail] SMTP not configured; skipping send", {
      to: options.to,
      subject: options.subject,
    })
    return { ok: true, skipped: true, reason: "smtp_not_configured" }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html ?? `<p>${options.text.split("\n").join("</p><p>")}</p>`,
    })

    return { ok: true, messageId: info.messageId }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[mail] send failed", message)
    return { ok: false, error: message }
  }
}
