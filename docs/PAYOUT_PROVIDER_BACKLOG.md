# Payout provider automation — backlog

**Today:** `VendorPayout` rows are **operational ledger** entries: admins can `POST /api/admin/finance/payouts` and export CSV; vendors see history via finance APIs. Stripe **Connect** transfers / automatic splits are **not** implemented in this repository.

## Next steps (when product requires PSP automation)

1. Choose **Stripe Connect** (Standard / Express) or regional equivalent.
2. Map marketplace charges → `vendorId` balance → `transfer` / `payout` objects with idempotency keys.
3. Webhooks: `transfer.paid`, `payout.failed`, etc. → update `VendorPayout.status` and audit log.
4. Reconcile CSV exports with PSP dashboard until automation is trusted.

Document PSP credentials and onboarding in the env matrix separately from the generic Stripe billing keys used for subscriptions.
