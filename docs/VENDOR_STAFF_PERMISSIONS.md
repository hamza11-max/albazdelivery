# Vendor staff roles and permissions

## Current model

- **Platform users** (`User` in Prisma) have roles: `CUSTOMER`, `VENDOR`, `DRIVER`, `ADMIN`. The session authorizes API routes by this role.
- **POS “staff” roles** (owner, manager, cashier, etc.) in the vendor app are defined in `utils/permissionsUtils.ts` and enforced **in the client UI** for tab visibility and actions.
- **Server-side (Phase 1):** `VendorStaffMember` links a `staffUserId` to a `vendorOwnerId` with `VendorStaffRole` (`MANAGER` | `CASHIER`). Helpers in `lib/vendor-staff-access.ts` resolve **which vendor’s data** a session may touch. High–blast-radius APIs updated to use this include **order status**, **order listing**, **ERP inventory**, and **post-to-delivery**. Fine-grained “cashier cannot X” still maps from UI only unless extended per route.

## Implications

- **Single vendor login:** unchanged — owner id equals session user id; no `VendorStaffMember` row required.
- **Multi-user staff:** create a `User` for each staff member (role `VENDOR` for vendor-app APIs), then add a `VendorStaffMember` row (`vendorOwnerId` = shop owner, `staffUserId` = staff user). Staff can then access the owner’s orders/inventory on the wired routes.
- **Sub-role matrix** (cashier vs manager) on the server is **not** fully enforced per action yet — extend `userActsAsVendorOwner` / role checks per route when needed.

## Roadmap (when multi-user is required)

1. ~~Model staff users linked to `vendorId` with role~~ — **Done:** `VendorStaffMember` + `VendorStaffRole`.
2. Authenticate staff on vendor APIs (same NextAuth session; employment row defines scope).
3. Map `permissionsUtils` to per-route checks using `VendorStaffRole` where finer control is required.
4. Keep the UI in sync with the same permission matrix as the server.

## Related

- Technical audit: `docs/TECHNICAL_PROJECT_AUDIT.md`  
- Admin / platform permissions are separate: platform `ADMIN` is enforced in `app/api/admin/*`.
