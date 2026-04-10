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

