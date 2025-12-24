# Project Analysis — AL-baz Delivery Platform

Last updated: 2025-12-23

This document summarizes a focused, practical analysis of the `albazdelivery` monorepo, covering architecture, key configurations, dependencies, tests/build, identified risks, and recommended next steps for maintainers.

## Summary
- Project type: Turborepo monorepo with multiple Next.js apps, shared packages, and mobile/electron variants.
- Main apps: `apps/customer`, `apps/vendor`, `apps/driver`, `apps/admin` (each with its own `package.json`).
- Shared packages: `packages/ui`, `packages/shared`, `packages/auth`.
- Tooling: TypeScript, Turborepo, Next.js, Prisma, Jest, Playwright, Tailwind, Turbo build scripts.

## Repository Structure (high level)
- `apps/` — next.js web apps (customer, vendor, driver, admin)
- `packages/` — shared code and UI library consumed via workspaces
- `mobile-apps`, `mobile-app-templates` — mobile targets (separate tooling)
- `prisma/` — Prisma schema + seeds (referenced in root scripts)
- `tests-e2e/`, `__tests__/` — test locations

## Key Configuration Findings

- Monorepo: root `package.json` declares `workspaces` and uses `turbo` for orchestration. This centralizes scripts like `dev`, `build`, `test`.
- TypeScript: strict compilation (`strict: true`, `noEmit`, `isolatedModules`) — positive for correctness. Path mappings expose `@albaz/*` packages across workspaces.
- Testing: Jest configured with multi-project setup (API and UI). Playwright present for E2E. Root test scripts set `NODE_ENV=test` and reference `jest.config.ts`.
- Prisma: `prisma generate` is invoked in `postinstall`/`prepare` scripts and referenced by many scripts (db:generate, db:migrate, db:push). Ensure Prisma schema and required environment variables (DATABASE_URL) are present when running these.

## Dependencies & Observations

- Root declares many dependencies; notable items:
  - `next` is present at root as `^16.0.7` while `apps/vendor` lists `next` at `^15.5.6` — version mismatch between workspace packages is risky and should be harmonized.
  - `react`/`react-dom` are `^18.3.1` consistently across packages.
  - Several packages are set to `"latest"` (e.g., many `@radix-ui/*`, `cmdk`, `sonner`, `uuid`, `vaul`) — using `latest` increases risk of accidental breaking upgrades and makes reproducible builds harder.
  - Prisma version: devDependency `prisma` ^6.18.0 and runtime `@prisma/client` ^6.1.0 — close but keep them aligned (use same minor/patch set where possible).
  - There are native modules (`better-sqlite3`, `node-gyp`, `sharp`-like patterns) that require platform toolchains on developer machines and CI (build tools, Python, C++ toolchain on Windows).
  - `electron`/`electron-builder` appear in `apps/vendor` — vendor app has an electron target; verify CI supports packaging and native builds.

## Scripts and Developer Experience

- Root scripts: `dev`, `build`, `start`, `lint`, `type-check`, plus Prisma and test orchestration. `vercel-build` uses a small node script and runs `prisma generate` before `next build`.
- Many app-level scripts call into root jest config and use `cross-env` and `powershell` helper scripts (e.g., `kill:port`, `restart:dev`). On Windows those PowerShell scripts are appropriate; for cross-platform CI ensure CI runner supports PowerShell or provide sh alternatives.

## Testing and CI Readiness

- Tests: Jest (unit/integ) and Playwright (E2E). Jest uses `ts-jest`/`babel-jest` presets; transformIgnorePatterns whitelists `next` and several libraries.
- Playwright tests exist under `tests-e2e/` and there are scripts to run them (including UI/debug modes).
- `test:ci` runs jest with coverage and Playwright tests — ensure CI has browsers (Playwright setup) and DB/fixtures for end-to-end runs.

## Immediate Risks & Pain Points

- Dependency inconsistencies:
  - `next` versions mismatch between root and app packages. This can cause build/runtime mismatches.
  - Many `latest` pins — non-reproducible builds and possible breakage.
- Native modules & Electron packaging:
  - Native modules (e.g., `better-sqlite3`) and electron packaging require platform build tools in CI (Windows/Linux/macOS differences). Missing these will break installs/builds.
- Prisma in `postinstall`:
  - `prisma generate` in `postinstall` may fail during `npm install` where DB env vars are missing. Consider guarding the script or using `prisma generate` in CI/build explicitly.
- Node/npm engine constraints:
  - Root `engines` require Node >=20.0.0 <24.0.0 and `packageManager` is `npm@11.6.2`. Ensure CI and developer machines use matching Node+NPM versions (use `.nvmrc` or `engine` checks and document in README).

## Recommended Action Plan (prioritized)

1. Harmonize critical dependency versions
   - Align `next` to a single major/minor across workspaces (decide on v15 vs v16). Prefer upgrading all packages to the same `next` version.
   - Replace `latest` pins with explicit version ranges and add a lockfile (npm uses package-lock.json). Consider adopting `npm ci` in CI.

2. Make installs reproducible & safe
   - Move `prisma generate` out of `postinstall` (or guard it with an `if` that checks for Prisma schema presence and env). Alternatively ensure CI explicitly runs `npm run db:generate` after dependencies are installed.
   - Add `engines` enforcement to CI and an `.nvmrc` file (or `.node-version`) to make local setup easier.

3. CI preparation for native builds and E2E
   - Ensure CI images include build tools for native modules (python, make, C++ toolchain) or use prebuilt binaries where possible.
   - Add a Playwright setup step in CI to install browsers (e.g., `npx playwright install --with-deps`) and a seeded DB or sqlite fallback for E2E.

4. Security & maintenance
   - Run `npm audit` and pin/upgrade vulnerable packages.
   - Add a scheduled dependency upgrade job (Dependabot / Renovate) to keep pinned versions updated and reviewed.

5. Developer docs & onboarding
   - Update `README` with exact steps to set up Node and npm versions, and call out required global tools for electron/native modules.
   - Provide a `scripts/setup-dev.sh` (and `.ps1` counterpart) to prepare local environment (install browsers, run prisma generate, seed DB).

## Suggested Commands (local developer)

```powershell
# Recommended local setup (Windows PowerShell)
nvm install 20
npm install
npm run db:generate
npm run dev

# Run tests (unit + e2e)
npm test
npm run test:e2e
```

## Suggested CI checklist
- Use Node 20.x image with npm matching `packageManager` (or override with a tested npm version).
- Run `npm ci` to install exact locked deps.
- Run `npx prisma generate` after install (avoid `postinstall` surprises).
- Install Playwright browsers: `npx playwright install --with-deps`.
- If electron packaging is required, run packaging steps on macOS/Windows runners as needed.

## Next Steps I Can Do (choose any)
- Run `npm install` and `npm test` in the workspace to capture runtime errors and failing tests (requires environment setup). 
- Scan `package.json` files for `latest` pins and produce a suggested `package-upgrade` plan.
- Create a CI example workflow for GitHub Actions that installs Node 20, runs `npm ci`, `prisma generate`, `npm run build`, and runs tests.

---

If you'd like, I can now (A) run the project's tests/build in this environment and report failures (I will attempt `npm ci` and `npm test`), (B) produce a PR that pins `latest` packages to explicit versions and adds `engines` enforcement, or (C) scaffold a GitHub Actions CI file tailored to this monorepo. Tell me which you'd prefer and I'll proceed.
# ALBAZ Delivery – Project Analysis

## Overview
- Monorepo on Next.js (App Router) with multiple vertical apps: customer, admin, driver, vendor; root `app/` duplicates key customer/admin/driver screens for deployment.
- Shared styling moved to ALBAZ neumorphic theme (cream/olive/gold, soft inset/outset shadows) via `app/globals.css` and synced to admin/driver/customer variants.
- UI library: `@albaz/ui` (Shadcn-style buttons/cards/badges/inputs). Icons: `lucide-react`. State: local React state; SSE/WebSocket utilities for live updates; Stripe client in checkout.
- Auth: next-auth credentials (`/api/auth`), session guards in pages, redirects per role (customer/admin/driver/vendor). Theme/language persisted via localStorage (`albaz-theme`, `albaz-language`) using `ThemeInitializer`.

## Apps & Responsibilities
- Root `app/`
  - Customer experience: `page.tsx` (large, home/category/store/checkout/orders/profile/tracking), package delivery, checkout, auth (login/signup), admin/driver copies.
  - Shared providers in `app/layout.tsx` and `providers/`.
- Customer worktree (`apps/customer/`): Dedicated customer app with themed globals, views, hooks (React Query), SSE, and WebSockets.
- Admin (`apps/admin/`): Header/dashboard restyled to neumorphic theme; additional views pending theme alignment.
- Driver (`apps/driver/`): Driver console restyled to neumorphic theme; location tracking, deliveries list, active delivery management.
- Vendor (`apps/vendor/`): Present but not yet restyled in this session.

## Theming & UX
- Theme tokens and animations in `app/globals.css` (also copied to admin/driver/customer apps):
  - `:root`/`html.dark` variables for backgrounds, text, shadows, borders.
  - Utility classes: `albaz-shell`, `albaz-card`, `albaz-nav`, `albaz-hero`, `albaz-promo`, `albaz-search`, neumorphic inset shadows, promo shimmer, pop-in/fade animations.
- Header/nav patterns: `albaz-nav` for soft translucent bar with active glow; cards use `albaz-card` with soft shadows; CTAs use olive/orange gradients or solid olive.

## Auth & Routing
- Login: Restyled gradient card, dynamic `signIn` import to avoid TS export issues.
- Signup: Role selection + form; now uses `albaz-shell`/`albaz-card`.
- Guards: Customer/driver/admin pages redirect on unauthenticated or wrong role.

## Data & Realtime
- Customer app uses React Query hooks (categories/stores/products/orders). SSE via `/api/notifications/sse` for order updates; WebSocket helper for realtime.
- Driver: SSE for notifications, geolocation tracking + polling for deliveries.
- Admin: Dashboards driven by fetched orders/users; further API integration assumed via `/api/*`.

## Payments
- Checkout client uses Stripe Elements (`CardElement`), posts to `/api/payments/create-intent`, confirms card, shows toast on success/failure.

## Recent Changes (this session)
- Neumorphic theme applied across customer root screens (home already themed), checkout, package-delivery, signup, login.
- Admin header/dashboard restyled; admin/driver globals synced to ALBAZ theme.
- Driver UI restyled to theme (header, cards, badges, CTAs, empty states).
- Login TS error fixed by dynamic importing `signIn`.

## Risks / Follow-ups
- Root `app/page.tsx` is large and mixes concerns; consider modularizing and aligning styling to `albaz-*` classes throughout.
- Vendor app still on older styling; pending port to theme.
- Admin views beyond header/dashboard not yet rethemed.
- Ensure consistency of theme persistence between root and apps (all use `ThemeInitializer`; some local state toggles—verify no double-sets).
- CRLF warnings on some staged files; normalize line endings if required by CI.
- Deployment: verify Vercel/host uses root `app/`; multiple app folders may be unused in that build—confirm the active target.

## Suggested Next Steps
- Customer: finish applying `albaz-card/nav` styling to remaining sections inside `app/page.tsx` (category/store/orders/profile/tracking) for full parity.
- Vendor: port globals and key screens to the theme.
- Admin: restyle remaining views (Approvals, AuditLog, User lists) with `albaz-card` and brand accents.
- Driver: light pass on typography/icon colors in remaining sections (history, active delivery details) to remove legacy gray/primary tokens.
- Add snapshots/checklists in README for theme usage and component patterns to reduce drift.

