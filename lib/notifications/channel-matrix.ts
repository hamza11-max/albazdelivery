/**
 * Product-facing matrix: which notification channels are intended for each domain event.
 * Implementation may lag this matrix; callers should treat unknown channels as "not wired."
 */

export type NotificationChannel = 'in_app' | 'sse' | 'email' | 'sms' | 'push'

export type NotificationEventDomain =
  | 'order_status'
  | 'order_assigned'
  | 'payment'
  | 'refund'
  | 'account_security'
  | 'registration'
  | 'broadcast'

/** Channels we aim to support per domain (primary → fallback order in ops runbooks). */
export const NOTIFICATION_CHANNEL_MATRIX: Record<
  NotificationEventDomain,
  { channels: NotificationChannel[]; notes?: string }
> = {
  order_status: {
    channels: ['in_app', 'sse', 'push'],
    notes: 'Push when device tokens exist; else polling + SSE.',
  },
  order_assigned: {
    channels: ['in_app', 'sse', 'push'],
    notes: 'Driver apps: prefer push when online.',
  },
  payment: {
    channels: ['in_app', 'email'],
    notes: 'Email for receipts when SMTP configured.',
  },
  refund: {
    channels: ['in_app', 'email'],
    notes: 'Email aligns with support expectations when available.',
  },
  account_security: {
    channels: ['email', 'sms', 'in_app'],
    notes: 'SMS only when Twilio configured; never rely on SSE alone.',
  },
  registration: {
    channels: ['email', 'in_app'],
    notes: 'Verification / welcome mail via SMTP.',
  },
  broadcast: {
    channels: ['in_app', 'sse'],
    notes: 'Admin broadcasts; durable in DB, best-effort realtime.',
  },
}

export function channelsForDomain(domain: NotificationEventDomain): NotificationChannel[] {
  return NOTIFICATION_CHANNEL_MATRIX[domain]?.channels ?? ['in_app']
}
