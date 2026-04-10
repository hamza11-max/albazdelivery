# Desktop + SaaS Architecture Baseline

This project is structured to support a production desktop client backed by SaaS services.

## Target split

- `apps/vendor` (desktop): Electron runtime, local hardware integration, optional offline cache.
- `apps/web` (frontend): Next.js web experience deployed to Vercel.
- `backend` or serverless API boundary: authentication, business logic, persistence, and file storage.

## Runtime responsibilities

- Keep in desktop:
  - local printing
  - scanner and RFID integration
  - offline-first workflows
- Move to backend:
  - auth/session token issuance
  - database and domain logic
  - file storage and background jobs

## Environment configuration

- Desktop/web API base URL is environment-driven through `NEXT_PUBLIC_API_BASE_URL`.
- In-app API consumers should use `withApiBaseUrl()` from `apps/vendor/lib/config/api-base-url.ts`.

## Update channels

- Stable users: `latest`
- Beta users: `beta`

The Electron app persists channel preference and applies it at runtime through `electron-updater`.
