# 📋 AL-baz الباز – Project Summary (updated 2025-12-07)

## Quick Overview
AL-baz is a multi-vendor delivery platform built as a turborepo with:
- Next.js web apps for customer, vendor (Electron-enabled), admin, and driver roles.
- Shared UI/package workspace (`packages/ui`), shared libraries under `lib/` and `utils/`.
- Mobile codebases (React Native templates and apps) present but currently secondary.
- Prisma/PostgreSQL backend with scripts for migrations, seeding, and admin bootstrap.

Key tech (current versions): Next.js 15.5, React 18.3, TypeScript 5.9, Prisma 6.x, NextAuth v5 beta, TailwindCSS 3.4, Upstash rate limiting, Sentry config files present.

Primary documentation to consult: `START_HERE.md`, `QUICK_START_CHECKLIST.md`, `IMPROVEMENT_ROADMAP.md`, `TECHNICAL_DEBT_ANALYSIS.md`, `PRODUCTION_READINESS_ASSESSMENT.md`.

---

## Architecture Snapshot
- Monorepo managed by Turbo (`packageManager: npm@11.6`, Node 20+). Root scripts drive dev/build/test across apps.
- Apps:
  - `apps/vendor`: Next.js + Electron POS, ERP APIs under `/app/api/erp/*`, extensive UI for POS/dashboard.
  - `apps/customer`: Next.js customer experience (ordering, tracking; App Router).
  - `apps/admin`: Next.js admin panel with CSRF helpers and audit/analytics routes.
  - `apps/driver`: Next.js driver portal with delivery APIs.
- Cross-cutting:
  - Security utilities (`lib/security/*`) implement CSRF via double-submit cookie, constant-time compares, and middleware helpers; admin app wraps these utilities.
  - Rate limiting via Upstash (`@upstash/ratelimit` + Redis).
  - Sentry client/server/edge configs exist (`sentry.*.config.ts`) but require DSN/environment wiring.
  - Prisma schema + seeds; scripts for admin creation and Prisma Studio.

---

## Current State (observed)
- **Security**: CSRF utilities are implemented and consumed in admin (`apps/admin/lib/csrf.ts`) and root middleware helpers. However, at least one vendor ERP route still hard-codes elevated roles (`apps/vendor/app/api/erp/categories/route.ts` sets `isAdmin = true` / `isVendor = false`), leaving an authentication bypass risk. Content-Security-Policy for Electron still needs verification.
- **Authentication**: NextAuth v5 beta is present; role enforcement is inconsistent in vendor ERP APIs.
- **Monitoring**: Sentry configuration files exist; no DSN checked in. Enable DSN and verify `SENTRY_AUTH_TOKEN` / environment before deployment.
- **Testing**: Jest + SWC are configured; Playwright e2e tests live in `tests-e2e/`. There are unit/integration tests covering security (CSRF, headers, middleware), ERP utilities, and vendor dashboard flows (`__tests__/` and `apps/vendor/__tests__/`). Coverage has not been recently measured—run `npm run test:coverage`.
- **Performance/UX**: Uses shadcn/ui components, Tailwind, and App Router. Electron POS includes offline hooks and barcode/receipt helpers.
- **Docs/ops**: Numerous setup guides for Vercel, Prisma, Electron, and mobile builds. `VERIFY_CHANGES.md` and `PHASE3_IMPLEMENTATION.md` exist inside `apps/admin`; vendor has `REFACTORING_PROGRESS.md`.

---

## Immediate Risks & Gaps
1) **Auth bypass in vendor ERP**: `apps/vendor/app/api/erp/categories/route.ts` still forces `isAdmin = true`; audit other ERP routes for similar shortcuts. Replace with real session/role checks (NextAuth) and deny by default.
2) **Monitoring disabled**: Sentry configs are present but inert without DSN/env. Errors will remain invisible in production.
3) **Coverage unknown**: Tests exist but no recent coverage baseline. Critical flows (auth, payments, order lifecycle) may be untested.
4) **Electron security posture**: Verify CSP and IPC hardening in `apps/vendor/electron/main.js` and preload scripts.
5) **Config drift risk**: Multiple setup docs; ensure `.env` values align across apps (NextAuth, database URL, Upstash, Sentry, Stripe).

---

## Recommended Next Actions
- **Security**: Remove all hard-coded role bypasses in vendor ERP APIs; enforce CSRF + session checks consistently. Re-run security tests afterward.
- **Monitoring**: Provide Sentry DSN/env and validate through a staging deploy; wire replay/trace rates appropriately.
- **Testing**: Run `npm run test:coverage` and `npm run test:e2e` to establish a baseline. Add coverage for authentication flows, payment intents, and critical API mutations.
- **Electron**: Add/verify CSP and sandboxing in `apps/vendor/electron/main.js`; audit preload for exposed globals.
- **Ops**: Use `QUICK_START_CHECKLIST.md` to align environments; follow `VERIFY_CHANGES.md` (admin) and `REFACTORING_PROGRESS.md` (vendor) for in-progress tasks.

---

## Useful Commands
- Install & generate Prisma: `npm install` → `npm run prisma:generate`
- Development (all apps): `npm run dev` (Turbo)
- Tests: `npm test` (Jest), `npm run test:coverage`, `npm run test:e2e` (Playwright)
- Database: `npm run db:migrate`, `npm run db:seed`, `npm run db:create-admin`

---

## Quick References
- Security utilities: `lib/security/csrf.ts`, `apps/admin/lib/csrf.ts`
- Auth routes: `apps/vendor/app/api/auth/*`, `apps/admin/app/api/admin/*`
- ERP APIs (vendor): `apps/vendor/app/api/erp/*`
- Testing entrypoints: `__tests__/`, `apps/vendor/__tests__/`, `tests-e2e/`
- Electron bootstrap: `apps/vendor/electron/main.js`, `electron-builder.yml`

---

You have solid foundations (Next.js 15, Prisma, CSRF utilities, rate limiting, Electron POS). Focus next on removing remaining auth shortcuts, turning on monitoring, and measuring/raising test coverage before any production deployment.
