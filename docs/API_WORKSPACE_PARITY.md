# API workspace parity (`app/api` vs `apps/*`)

The monorepo still contains **duplicate route trees**: the canonical root `app/api/**` and copies under `apps/admin`, `apps/vendor`, `apps/customer`, and `apps/driver`. Fixes should land in the **canonical** tree first when both exist.

Enforcement: `node scripts/verify-api-parity.mjs` (opt out: `VERIFY_API_PARITY_SKIP=1`). Compares `apps/admin/app/api` paths to files on disk under root `app/api`.

```bash
git ls-files 'apps/*/app/api/**/*.ts' | sed 's|^apps/[^/]*/app/api/|app/api/|' | sort -u > /tmp/apps-as-root.txt
git ls-files 'app/api/**/*.ts' | sort -u > /tmp/root.txt
comm -23 /tmp/apps-as-root.txt /tmp/root.txt
```

Anything printed is an API path mirrored in an app workspace **without** a same-relative file under root `app/api` — treat as tech debt or intentional app-only surface; document the exception.

## Stripe webhooks and workers

Stripe side effects can run **in-process** (default) or **queued** when `REDIS_HOST` and `STRIPE_WEBHOOK_USE_QUEUE=1` are set — see `docs/BACKGROUND_JOBS_AND_REDIS.md`.
