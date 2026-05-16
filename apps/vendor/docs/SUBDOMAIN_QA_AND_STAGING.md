# Subdomain & storefront — staging QA matrix

For a broader staging and release checklist (DB, CI, Electron, driver fleet), see [`docs/STAGING_CHECKLIST.md`](../../../docs/STAGING_CHECKLIST.md).

Run these checks on **staging** before promoting DNS or config to production.  
Middleware and tenant resolution are covered in code by `__tests__/api/middleware/host-rewrite.test.ts` and `__tests__/api/lib/domain-utils.test.ts`.

## Environment parity

| Check | Staging | Production |
|-------|---------|------------|
| `BASE_DOMAIN` matches public apex (e.g. `al-baz.app`) | ☐ | ☐ |
| `NEXTAUTH_URL` / app URLs point to correct host | ☐ | ☐ |
| TLS certificate valid for apex + `*.{BASE_DOMAIN}` (or per-subdomain certs) | ☐ | ☐ |
| Same Prisma migrations applied | ☐ | ☐ |

## DNS

| Check | Notes |
|-------|--------|
| Apex `A` or `ALIAS` to hosting | ☐ |
| Wildcard `*` CNAME or individual `CNAME` for vendor subdomains | ☐ |
| Custom domain `CNAME`/`A` matches docs in `docs/CUSTOM_DOMAINS_README.md` | ☐ |

## Functional matrix (browser)

| Scenario | Expected |
|----------|----------|
| Valid verified subdomain `{slug}.{BASE_DOMAIN}/` | Storefront loads; URL rewritten internally to `/s/{slug}/…` |
| Wrong / unknown subdomain | No verified vendor → storefront 404 or marketing fallback (per app behavior) |
| Reserved label (`admin`, `api`, `vendor`, `drivers`, …) | **No** storefront rewrite; platform routes only |
| Unverified `vendorSubdomain` / `vendorCustomDomain` | Resolver rejects until `VERIFIED` |
| Subscription suspended / `PAST_DUE` (domains) | Domain writes / verification blocked per `domain-entitlements` |
| Custom domain host (not under `BASE_DOMAIN`) | Rewrite to `/s/__host__/…`; layout resolves vendor from `x-tenant-host` |

## Notes

- **No-tenant 404** is enforced in **App Router** / API after rewrite, not in Edge middleware (middleware only sets headers + rewrite).
- For local dev, see `VENDOR_DOMAINS_DEV_UNLOCK` and `{slug}.localhost` behavior in host-rewrite tests.
