# Admin: subscriptions & feature overrides

## Data model

- `Subscription.featureOverrides` (nullable JSON): partial overrides keyed like `PlanFeatures` (`cloudSync`, `maxProducts`, `support`, …).
- Effective rights are always computed server-side via `resolveVendorEntitlements(plan, status, featureOverrides)` in [`lib/subscriptions/resolve-entitlements.ts`](../lib/subscriptions/resolve-entitlements.ts).

When the subscription **status/plan combo** does not grant paid features (`subscriptionStatusGrantsPlanFeatures`), the baseline is **`STARTER`**, then overrides are merged — so expired paid plans fall back to starter caps unless admins grant overrides.

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/subscriptions` | Vendor session — returns `{ subscription, entitlements }`. |
| GET | `/api/admin/subscriptions` | Admin list + stats |
| POST | `/api/admin/subscriptions` | Create subscription (CSRF — `apps/admin`) |
| GET | `/api/admin/subscriptions/[id]` | Detail: `subscription`, `planBaseline`, `effectiveEntitlements`, `featureOverrides` |
| PATCH | `/api/admin/subscriptions/[id]` | Extend period / change `plan` or `status` (CSRF) |
| PATCH | `/api/admin/subscriptions/[id]/entitlements` | Merge JSON overrides (CSRF); audited as `SUBSCRIPTION_ENTITLEMENTS_UPDATED`. |

Mirrored routes exist under **`app/api/admin/`** for the root Next app deployment.

## UI

[`apps/admin`](../apps/admin/app/admin/page.tsx): **Abonnements** tab → [`SubscriptionsManageView`](../apps/admin/components/SubscriptionsManageView.tsx).

## Stripe caveat

Changing **plan** or billing-related fields from the admin UI does **not** automatically update Stripe subscriptions. Keep Stripe and internal `Subscription` aligned operationally or add a billing sync workflow later.
