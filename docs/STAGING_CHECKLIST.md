# Staging and release checklist

Use this before promoting **web**, **API**, or **vendor desktop** builds to production. Pair with subdomain-specific checks in [`apps/vendor/docs/SUBDOMAIN_QA_AND_STAGING.md`](../apps/vendor/docs/SUBDOMAIN_QA_AND_STAGING.md).

## Database and Prisma

| Step | Done |
|------|------|
| `npx prisma migrate deploy` against the **staging** database (same migration set as production will use) | ☐ |
| `npx prisma generate` in CI / build images matches the deployed commit | ☐ |
| Smoke: create order, vendor status transitions, **driver assignment** (Pro+ / `driverFleetManagement`) | ☐ |

## Environment variables (staging)

| Variable / area | Notes |
|-----------------|--------|
| `DATABASE_URL` | Pooled URL for serverless if applicable |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Match staging host |
| `BASE_DOMAIN` / tenant DNS | See subdomain QA doc |
| Feature flags / plan mapping | Starter vs Pro for **driver fleet** (invite, assign, dispatch toggle) |

## Continuous integration (local parity)

| Command | Purpose |
|---------|---------|
| `npm run verify:api` | **`check:rate-limit`** + full **`test:api`** (mocked API Jest project; same tests as PR’s first Jest step, no Postgres) |
| `npm run verify:phase-a` | Root **`type-check`** then **`verify:api`** (local equivalent of PR typecheck + API Jest) |
| `npm run test:api` | Mocked **api** Jest project only (`--ci`, no Postgres) |
| `npm run test:jest-ui` | **ui** Jest project (jsdom) |
| `npm run test:ci` | API + UI coverage dirs + Playwright `tests-e2e/` (matches main `CI` workflow intent) |
| `npm run type-check` / `npm run type-check:vendor` | Root + vendor app TypeScript |

## Vendor Electron (Windows)

| Step | Done |
|------|------|
| `npm run type-check:vendor` | ☐ |
| Pick flavor: `npm run electron:build:win:restaurant` (or retail / grocery / other) **from repo root** via `-w @albaz/vendor` or `cd apps/vendor` per your habit | ☐ |
| Optional strict artifact check after a local full or partial build: `npm run electron:verify:strict -w @albaz/vendor` | ☐ |
| GitHub Actions: workflow **Electron vendor (Next standalone)** (`electron-preflight.yml`) — manual `workflow_dispatch` on Windows to validate **Next standalone** without publishing | ☐ |
| Release workflow: `.github/workflows/build.yml` — requires `GH_TOKEN` for publish; confirm flavor input | ☐ |

## Driver ↔ vendor (staging smoke)

| Scenario | Expected |
|----------|------------|
| Vendor invites driver (email/phone) | Pending row `VENDOR_INVITED`; driver sees **Invitations commerçants** |
| Driver accept / decline | `POST /api/drivers/vendor-connection`; vendor notification |
| Driver requests vendor | `DRIVER_REQUESTED` pending; vendor accepts from dashboard |
| Order **PATCH** with `driverId` | Only if connection **ACCEPTED** and `availableForDispatch`; plan allows fleet |

## API parity (web vs Electron vendor)

| Endpoint | Notes |
|----------|--------|
| `PATCH /api/vendors/orders` | Supports `status` and/or `driverId` (root app aligned with vendor app) |
| `GET /api/vendors/orders` (vendor app) | Uses `session.user.id` as vendor scope when role is **VENDOR** |

## Rollback

| Step | Done |
|------|------|
| Previous deployment revision tagged | ☐ |
| DB rollback plan documented (if migration is backward-incompatible, restore from backup instead of `migrate down` in prod) | ☐ |
