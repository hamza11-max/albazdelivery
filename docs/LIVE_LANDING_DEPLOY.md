# live.al-baz.app — deployment checklist

Project intro landing is served from the main Next.js app at [`app/live/`](../app/live/). Middleware rewrites `live.{BASE_DOMAIN}/` to `/live`.

## Vercel (same project as al-baz.app)

1. **Settings → Domains** → add `live.al-baz.app` (Production).
2. Confirm **Valid Configuration** and TLS (automatic after DNS propagates).
3. Production env:
   - `BASE_DOMAIN=al-baz.app`
   - `NEXTAUTH_URL=https://al-baz.app`
   - `NEXT_PUBLIC_APP_URL=https://al-baz.app`
   - Optional: `ALBAZ_PLATFORM_HOSTS=al-baz.app,www.al-baz.app,live.al-baz.app`

## DNS

| Record | Target |
|--------|--------|
| `live` CNAME | Vercel target (e.g. `cname.vercel-dns.com`) if no wildcard |
| `*.al-baz.app` | Already pointing at Vercel → add domain in Vercel only |

## Smoke tests

- `https://live.al-baz.app/` → marketing page (French)
- `https://live.al-baz.app/signup` → registration
- `https://{vendorSlug}.al-baz.app/` → vendor storefront unchanged
- Vendor cannot claim subdomain `live` (reserved)
