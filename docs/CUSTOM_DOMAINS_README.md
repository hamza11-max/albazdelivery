# Custom Domains (Vendor + Store)

This project supports custom domains at two levels:

- Vendor-level domain on `User` (`role=VENDOR`)
- Store-level domain on `Store` (store override)

Store-level custom domains take precedence over vendor-level domains during host resolution.

## Subscription Rules

- `STARTER`: no custom domains
- `PROFESSIONAL`: 1 vendor custom domain + up to 1 store custom domain
- `BUSINESS`: 1 vendor custom domain + up to 5 store custom domains
- `ENTERPRISE`: 1 vendor custom domain + unlimited store custom domains

Domain writes/verifications are allowed only when subscription status is `ACTIVE` or `TRIAL`.

## API Endpoints

### Vendor domains

- `GET /api/vendor/domains`
- `POST /api/vendor/domains`
- `POST /api/vendor/domains/verify`

### Store domains

- `GET /api/stores/:id/domains`
- `POST /api/stores/:id/domains`
- `POST /api/stores/:id/domains/verify`

The same route set is mirrored under `apps/vendor/app/api/...` for the vendor app surface.

## Example Requests

### Configure vendor domain

```bash
curl -X POST http://localhost:3000/api/vendor/domains \
  -H "Content-Type: application/json" \
  -d '{
    "vendorSubdomain": "myvendor",
    "vendorCustomDomain": "shop.vendor.com"
  }'
```

### Verify vendor domain

```bash
curl -X POST http://localhost:3000/api/vendor/domains/verify \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Configure store domain

```bash
curl -X POST http://localhost:3000/api/stores/<storeId>/domains \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "store-a",
    "customDomain": "storea.vendor.com"
  }'
```

### Verify store domain

```bash
curl -X POST http://localhost:3000/api/stores/<storeId>/domains/verify \
  -H "Content-Type: application/json" \
  -d '{}'
```

## DNS Verification Notes

When a custom domain is set, the API returns verification instructions:

- TXT record at `_albaz-verify.<domain>` with a generated token
- CNAME target from `CUSTOM_DOMAIN_CNAME_TARGET` (or default placeholder)

Verification endpoint marks status:

- `VERIFIED` when DNS checks pass
- `FAILED` when DNS is not ready
- `PENDING` right after setup/update

## Test Commands

Run domain tests:

```bash
npm exec jest -- --config jest.config.ts --selectProjects api --runTestsByPath \
  __tests__/api/domains/vendor-domains.test.ts \
  __tests__/api/domains/vendor-domains-verify.test.ts \
  __tests__/api/domains/store-domains.test.ts \
  __tests__/api/domains/store-domains-verify.test.ts \
  __tests__/api/lib/domain-entitlements.test.ts \
  __tests__/api/lib/domain-utils.test.ts --runInBand
```

## Required Environment Variables

- `BASE_DOMAIN` (example: `albazdelivery.com`)
- `CUSTOM_DOMAIN_CNAME_TARGET` (recommended in production)
- `DATABASE_URL`

For production domain provisioning on Vercel (auto-SSL for verified custom domains):

- `VERCEL_API_TOKEN` — token with `domain.write` scope on the project
- `VERCEL_PROJECT_ID` — `prj_xxx` id of the deployed project
- `VERCEL_TEAM_ID` — optional, only for team-owned projects

When these are missing locally, `lib/domains/vercel-provisioning.ts` is a no-op; verification still succeeds but no external provisioning runs.

## Vendor Storefronts (take.app-style subdomains)

Each verified vendor gets a branded public storefront reachable at:

- `https://<vendorSubdomain>.${BASE_DOMAIN}` — e.g. `https://demo.albazdelivery.com`
- `https://<vendorCustomDomain>` — e.g. `https://shop.myvendor.com`

The storefront offers a catalog, cart, and guest checkout that funnels orders
into the existing `Order` model and WhatsApp vendor notification pipeline.

### Request flow

```
Customer browser → middleware.ts (extracts host, rewrites URL)
                 → /s/<vendorSlug>/...  (storefront App Router pages)
                 → /api/public/storefront/<vendorSlug>/...  (public APIs)
                 → prisma → DB
```

`middleware.ts` detects the incoming host; if the host is a vendor subdomain
or a verified custom domain, the request is rewritten to
`/s/<vendorSlug>/<original-path>`. The `x-tenant-host` and
`x-tenant-subdomain` headers are forwarded so server components and API
routes can resolve the tenant without re-parsing the URL.

### Key code

- `middleware.ts` — host normalization + rewrite.
- `lib/domains/resolve-host.ts` — host → vendor/store precedence resolution.
- `lib/storefront/resolve-vendor-slug.ts` — public API tenant resolution.
- `app/s/[vendorSlug]/layout.tsx` — storefront layout + branding.
- `app/api/public/storefront/*` — profile, catalog, products, orders.

### Demo vendor (seed)

Running `npx prisma db seed` creates a demo vendor with:

```
email:             vendor@test.com / Vendor123!
vendorSubdomain:   demo
status:            VERIFIED
storefrontAccentColor: #ea580c
```

### Local testing (without a real domain)

Pick one of the following approaches to hit the storefront locally:

**Option A — `*.localhost` (works in Chrome/Firefox out of the box)**

No hosts-file edit needed in modern browsers; `*.localhost` resolves to
127.0.0.1 automatically.

1. `BASE_DOMAIN=localhost` in your `.env`
2. `npm run dev`
3. Visit `http://demo.localhost:3000/`

**Option B — Custom apex via hosts file**

1. Edit `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts`:

   ```
   127.0.0.1 albazdelivery.local
   127.0.0.1 demo.albazdelivery.local
   ```

2. Set `BASE_DOMAIN=albazdelivery.local` in your `.env`.
3. Add `albazdelivery.local` and `demo.albazdelivery.local` to
   `ALLOWED_ORIGINS` if you will hit public APIs cross-origin.
4. `npm run dev` → open `http://demo.albazdelivery.local:3000/`.

**Option C — Custom domain without DNS (browser-side)**

For `?host=` overrides in local dev only, the middleware still resolves via
the `Host` header — easiest is to combine with option A or B above.

### Vendor UI

Vendors manage their subdomain and optional custom domain from:

- `apps/vendor/app/vendor/settings/domains/page.tsx` (standalone page)
- `apps/vendor/components/security/VendorDomainsCard.tsx` (embedded in the
  Settings tab of the main vendor dashboard)

The card displays DNS TXT + CNAME instructions, a "Verify" button, a live
preview link once status is `VERIFIED`, and subscription-plan guardrails.

