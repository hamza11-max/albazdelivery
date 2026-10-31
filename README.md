# AL-baz POS

Offline-first point-of-sale and stock app for small Algerian retail shops (Windows desktop), with cloud backup and an owner dashboard.

**Status:** being rebuilt. The plan, MVP scope and architecture are in **[docs/PRODUCT_SPEC_AND_ANALYSIS.md](docs/PRODUCT_SPEC_AND_ANALYSIS.md)**. The previous delivery-marketplace code is preserved on the `archive/marketplace` branch.

## Repository layout (transitional)

```
app/            Root Next.js app — cloud API routes, admin and legacy marketplace pages
apps/vendor/    Current vendor/ERP app (Next.js + Electron) — to be replaced by apps/pos
apps/customer/  Legacy customer app — removal pending (see spec, Phase 0 pass 2)
apps/admin/     Legacy admin workspace — removal pending
packages/       Shared UI, utilities and auth
lib/            Shared server libraries (Prisma, auth, rate limiting, …)
prisma/         Database schema and migrations
docs/           Spec and technical notes
```

## Development

Requires Node.js 20.19+ and npm 10+.

```bash
npm install
npm run db:generate
npm run dev
```

Copy `.env.example` to `.env` and fill in values. **Never commit `.env*` files** — only `.env.example` is tracked, and CI runs a gitleaks secret scan on every push and pull request.

## Checks

```bash
npm run type-check
npm test
npm run test:e2e
```

Release notes go in [CHANGELOG.md](CHANGELOG.md).
