# Guest / QR dine-in orders — product policy

## Supported models

1. **Electron / dedicated host (file-backed):** Guest orders may use local JSON storage in the vendor desktop app. This is the **default** safe path when Postgres guest storage does not exist.

2. **Serverless / Vercel without DB guest storage:** File-backed guest flows are **blocked** unless `GUEST_ORDERS_ALLOW_ON_VERCEL=1` after a deliberate migration to durable storage (see `lib/guest-orders-deployment.ts`).

## Rules

- Never enable `GUEST_ORDERS_ALLOW_ON_VERCEL` until guest payloads are persisted in **Postgres** (or equivalent) with tenant and retention rules.
- Operations can disable guest cloud entirely with `GUEST_ORDERS_DISABLE=1`.
- Admin read-only telemetry: `GET /api/admin/system/config` exposes `guestOrdersOnVercel` for runbook checks.

## Future: Postgres `GuestOrder`

If cloud guest checkouts become a requirement, add a dedicated model (tenant id, session id, TTL, JSON payload) plus migration and API tests — do not overload `Order` without a product decision.
