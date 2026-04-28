# Notification channels (strategy)

## Channels in the codebase

- **In-app:** `Notification` records in Postgres; users read unread state via API/UI.
- **Real-time:** **SSE** at `/api/notifications/sse` (best-effort; clients should reconnect).
- **Email / SMS:** Use **SMTP**, **Twilio**, etc., when configured in env — see `ENV_TEMPLATE.md`.

## SLA expectations

Persisted notifications are durable for **read history**. SSE is **best-effort** for low-latency hints; outages can be bridged via polling until push is wired.

Outbound **email/SMS/push** require operational providers (DNS reputation, quotas, alerting). Avoid promising strict paid-tier SLAs on those channels until delivery and monitoring are validated.

## Event → channel matrix (target)

Authoritative structure in code: `lib/notifications/channel-matrix.ts` (`NOTIFICATION_CHANNEL_MATRIX`).

| Domain event | Primary channels | Fallback / notes |
|--------------|------------------|------------------|
| Order status | in_app, sse, push | Poll when SSE down; push needs device tokens. |
| Order assigned (driver) | in_app, sse, push | Same as above. |
| Payment / receipt | in_app, email | SMTP required for email. |
| Refund | in_app, email | Align copy with support policy. |
| Account security | email, sms, in_app | SMS only when Twilio configured. |
| Registration | email, in_app | Verification mail via SMTP. |
| Admin broadcast | in_app, sse | Persisted notifications are durable. |

## Suggested rollout

1. In-app unread + SSE for core order/status events.
2. Transactional email for security and registration flows (SMTP).
3. Optional SMS/marketing — additional infra and consent requirements.
