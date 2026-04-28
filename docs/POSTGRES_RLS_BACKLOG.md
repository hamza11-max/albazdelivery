# PostgreSQL RLS — backlog

**Status:** Row Level Security is **not** enabled in production schema today. Isolation relies on application-layer queries and role checks.

## When to adopt RLS

- Multi-tenant **enterprise** contracts requiring DB-enforced separation.
- Reduced blast radius if an application bug ignores `vendorId` filters.

## Suggested approach (non-migrated)

1. Enable RLS per table after **policy design review** (vendors may own rows where `vendorId = current_setting('app.vendor_id')::text` — requires session GUC set per request).
2. Use a **database role** for the app with `BYPASSRLS` disabled.
3. Pilot on low-risk read-mostly tables before `Order` / `Payment`.

## Caveat

Prisma + connection pooling + per-request GUCs need a disciplined middleware (e.g. `SET LOCAL` in transaction). Treat this as a **program**, not a one-line migration.
