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

