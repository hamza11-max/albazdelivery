# Security program (lightweight)

Enterprise buyers expect **process**, not only features. This repo encodes a minimal baseline:

| Control | Implementation |
|---------|----------------|
| **Dependency updates** | Weekly Dependabot PRs (`.github/dependabot.yml`). |
| **CI audit signal** | PR workflow runs `npm audit --audit-level=critical` (non-blocking initially; tighten when backlog is green). |
| **CSRF on admin mutations** | `scripts/verify-admin-csrf.mjs` requires `csrfProtection` in root `app/api/admin` mutating routes. |
| **Secrets** | `scripts/verify-deploy-env.mjs` for production gates; no secrets in client bundles. |
| **Financial audit** | `lib/security/financial-audit.ts` + `AuditLog` for refunds / payout ledger rows. |

## Annual / manual

- **Penetration test:** Scope: auth, admin CSRF, webhook replay, multi-tenant boundaries, desktop guest flows. Track findings in your issue system; retest after major releases.
- **Secret scanning:** Run org-wide secret scan on CI (e.g. GitHub secret scanning) beyond this repo.
- **Access review:** Who has production DB, Stripe dashboard, and Vercel project admin.
