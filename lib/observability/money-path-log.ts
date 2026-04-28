/**
 * Structured logs for Stripe / payments code paths — works with JSON log drains (Vercel, Datadog, etc.).
 * Default payload avoids PII; pass only ids and types in `detail`.
 */

export type MoneyPathLogSeverity = 'info' | 'warn' | 'error'

export function logMoneyPathEvent(opts: {
  component: string
  action: string
  severity?: MoneyPathLogSeverity
  stripeEventId?: string
  eventType?: string
  durationMs?: number
  /** Correlate with HTTP request or job id */
  correlationId?: string
  /** Marketplace ids for dashboard filters (no PII) */
  orderId?: string
  paymentIntentId?: string
  detail?: Record<string, unknown>
}): void {
  const {
    component,
    action,
    severity = 'info',
    stripeEventId,
    eventType,
    durationMs,
    correlationId,
    orderId,
    paymentIntentId,
    detail,
  } = opts
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    observability: 'money_path_v1',
    component,
    action,
    severity,
  }
  if (stripeEventId) payload.stripeEventId = stripeEventId
  if (eventType) payload.eventType = eventType
  if (durationMs !== undefined) payload.durationMs = durationMs
  if (correlationId) payload.correlationId = correlationId
  if (orderId) payload.orderId = orderId
  if (paymentIntentId) payload.paymentIntentId = paymentIntentId
  if (detail && Object.keys(detail).length > 0) payload.detail = detail

  const line = JSON.stringify(payload)
  if (severity === 'error') console.error(line)
  else if (severity === 'warn') console.warn(line)
  else console.info(line)
}

/** Report to Sentry when configured — no-op without DSN. */
export async function captureMoneyPathException(
  error: unknown,
  extra: Record<string, string | number | boolean | undefined>
): Promise<void> {
  try {
    if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return
    }
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureException(error, {
      tags: { scope: 'money_path' },
      extra,
    })
  } catch {
    // avoid throwing from telemetry
  }
}
