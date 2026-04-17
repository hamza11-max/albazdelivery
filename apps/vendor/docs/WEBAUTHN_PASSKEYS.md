# WebAuthn Passkeys: Admin + Vendor Flow

## Feature Flags

Enable both flags to activate passkeys:

- `ALBAZ_FEATURE_WEBAUTHN_PASSKEYS=true` (server-side API gates)
- `NEXT_PUBLIC_ALBAZ_FEATURE_WEBAUTHN_PASSKEYS=true` (client UI gates)

## Enrollment Lifecycle

1. Vendor signs in with password.
2. Vendor opens Settings and enrolls a passkey.
3. Enrollment is stored with `PENDING` status.
4. Admin reviews passkeys in `Admin > Passkeys`.
5. Admin can:
   - Approve -> status `APPROVED`
   - Reject -> status `REJECTED`
   - Revoke -> status `REVOKED`

Only approved credentials are accepted for passkey sign-in.

## Login Flow

1. Vendor enters email/phone on login page.
2. Vendor selects `Se connecter avec passkey`.
3. Server issues auth challenge and validates credential status.
4. Server returns a short-lived one-time `passkeyToken`.
5. Login finalizes through NextAuth credentials using `passkeyToken`.

## Security Controls Implemented

- Short-lived challenges and one-time consumption
- Short-lived one-time sign-in grants (`passkeyToken`)
- API rate limits on options/verify endpoints
- Passkey audit log events for issuance, success/failure, and admin moderation
- Explicit admin-only moderation API for approval/revocation

## Important Naming

- `SubscriptionPasskey` remains the subscription activation code flow.
- `WebAuthnCredential` is the authentication passkey flow.

These two systems are intentionally separate to avoid operational confusion.
