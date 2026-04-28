# Data subjects, export, and deletion (hooks)

This document aligns **product behavior** with common GDPR-style expectations. It is **not legal advice**; finalize wording with counsel.

## Subprocessors (non-exhaustive)

Align your customer-facing policy with what you actually enable in production:

- **Hosting / app:** Vercel (or your host).
- **Database:** Postgres provider (e.g. Neon).
- **Payments:** Stripe.
- **Email / SMS:** SMTP provider, Twilio (if configured).
- **Error / performance:** Sentry (if `SENTRY_DSN` set).
- **Rate limit / cache:** Upstash (if `UPSTASH_REDIS_*` set).
- **Redis / queues:** Your Redis provider for BullMQ TCP (if `REDIS_HOST` set).

## Data export (self-service hook)

- **Endpoint:** `GET /api/user/data-export` (authenticated session required).
- **Response:** JSON snapshot of the signed-in user profile (no password hash), saved addresses, and recent orders / vendor / driver order summaries (capped list sizes in code).
- **Gaps:** Does not include every derived metric or admin-only join; extend the handler as legal/product scope expands. Enterprise DSAR workflows may still require **manual** extracts from admin tooling.

## Erasure (“right to be forgotten”)

**Partially automated**

- **Endpoint:** `POST /api/user/account/anonymize` (session + **CSRF** header/cookie required). Irreversible for login: email/phone/name cleared, password rotated random, staff links removed, inbox notifications for recipient cleared. **Admin** accounts are **rejected** (use separate process).
- **Export:** `GET /api/user/data-export` (authenticated).

**Not fully automated** in this codebase. A production process should still define:

1. **Identity verification** (support ticket or in-app flow).
2. **Scope:** customer vs vendor vs driver — related orders may be **retained** for tax / dispute / fraud (legal basis: legal obligation / legitimate interest).
3. **Technical steps:** anonymize PII on `User` (email, phone, name), retain non-identifying order rows if required by policy; or soft-delete with retention TTL.
4. **Propagation:** Stripe customer data, email lists, and third-party tools require **parallel** deletion requests.

Track completion in a ticket and optionally append a row to `AuditLog` (see `lib/security/audit-log.ts`).

## Audit log retention

`AuditLog` rows are **append-style** for admin and security events. Define a **retention window** (e.g. 13–24 months) in ops policy and implement archival/purge via scheduled job when required.

## Financial audit trail

Money-impacting admin actions (e.g. refund completion, manual payout ledger rows) should write to `AuditLog` via `lib/security/financial-audit.ts` with `resource` values such as `REFUND` and `VENDOR_PAYOUT` for investigations.
