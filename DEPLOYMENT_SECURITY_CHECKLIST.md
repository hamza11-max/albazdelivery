# Deployment Security Checklist

Use this checklist before production deployment or release approval.

## 1. Secrets and environment configuration

- [ ] DATABASE_URL is set and valid.
- [ ] NEXTAUTH_SECRET is set and unique to the environment.
- [ ] If Stripe is enabled, STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set.
- [ ] No secret values are committed to source control.
- [ ] .env files are excluded from version control and not exposed in logs.
- [ ] Production host URLs match the deployed domain exactly.

## 2. Authentication and session security

- [ ] Authentication is enforced on protected routes.
- [ ] Session cookies use secure settings in production.
- [ ] CSRF protection is enabled for all public mutation endpoints.
- [ ] Admin mutation routes validate CSRF before processing state changes.
- [ ] Sensitive user actions are logged with audit trails.

## 3. API and transport security

- [ ] HTTPS is enforced in production.
- [ ] HSTS is enabled for production domains.
- [ ] Security headers are applied to all responses.
- [ ] CORS validates the incoming Origin header against an allowlist.
- [ ] No overly permissive wildcard origins are used in production.
- [ ] API endpoints reject malformed or unexpected requests cleanly.

## 4. Rate limiting and abuse protection

- [ ] Redis-backed rate limiting is configured for production.
- [ ] In-memory fallback is not relied on in multi-instance environments.
- [ ] Authentication and payment-related endpoints have stricter rate limits.
- [ ] Rate-limit violations are logged and monitored.
- [ ] Strict production rate-limit enforcement is reviewed before go-live.

## 5. Webhooks and external integrations

- [ ] Stripe webhook signatures are validated.
- [ ] WhatsApp or Meta callback verification tokens are configured correctly.
- [ ] Replayed or invalid webhook payloads are rejected safely.
- [ ] Sensitive webhook processing is handled through a validated queue or worker path when needed.

## 6. Content and browser security

- [ ] CSP is reviewed and tightened for production.
- [ ] unsafe-inline and unsafe-eval use is justified and minimized.
- [ ] Inline scripting is reduced to the lowest feasible level.
- [ ] No untrusted user content is rendered without sanitization.

## 7. Access control and tenancy

- [ ] Vendor, admin, and customer roles are properly separated.
- [ ] Tenant or subdomain boundaries are validated before routing.
- [ ] Custom domains are checked against allowed host rules.
- [ ] Reserved or internal subdomains are blocked appropriately.

## 8. Logging and monitoring

- [ ] Security events are captured for failed authentication, CSRF issues, and rate-limit violations.
- [ ] Logs are reviewed regularly.
- [ ] Suspicious activity is alertable to an operator or support team.
- [ ] Audit logs retain enough data for incident review without violating privacy requirements.

## 9. Dependency and release hygiene

- [ ] Dependabot or equivalent updates are active.
- [ ] Security-related dependencies are reviewed before release.
- [ ] Build and deployment checks are passing.
- [ ] A rollback plan exists for critical security incidents.

## 10. Final sign-off

- [ ] A human owner has reviewed this checklist.
- [ ] Outstanding risks are accepted or mitigated.
- [ ] Production environment matches the approved security baseline.
- [ ] Release is approved only after all required boxes are checked.
