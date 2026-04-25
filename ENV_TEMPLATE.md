# Environment Variables Template

Copy the variables below into your `.env` file and fill in your actual values.

```bash
# ==============================================
# AL-BAZ DELIVERY PLATFORM - ENVIRONMENT VARIABLES
# ==============================================

# ==============================================
# DATABASE CONFIGURATION
# ==============================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/albazdelivery?schema=public"

# ==============================================
# AUTHENTICATION & SECURITY
# ==============================================
# Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# ==============================================
# REDIS / UPSTASH (CACHING & RATE LIMITING)
# ==============================================
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
REDIS_URL="redis://localhost:6379"

# ==============================================
# OAUTH PROVIDERS (OPTIONAL)
# ==============================================
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ==============================================
# EMAIL CONFIGURATION
# ==============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@albazdelivery.com"

# ==============================================
# SMS / OTP CONFIGURATION
# ==============================================
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# ==============================================
# PAYMENT PROCESSING
# ==============================================
STRIPE_PUBLIC_KEY="pk_test_your-stripe-public-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# ==============================================
# MAPS & LOCATION SERVICES
# ==============================================
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# ==============================================
# FILE STORAGE
# ==============================================
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ==============================================
# ERROR TRACKING & MONITORING
# ==============================================
SENTRY_DSN="your-sentry-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
# Comma-separated app/admin hosts that must never be treated as vendor custom
# storefront domains by middleware. Add production domains such as "al-baz.app".
ALBAZ_PLATFORM_HOSTS=""

# ==============================================
# FEATURE FLAGS
# ==============================================
ENABLE_LOYALTY_PROGRAM="true"
ENABLE_CHAT_SUPPORT="true"
ENABLE_PACKAGE_DELIVERY="true"
ENABLE_PAYMENT_GATEWAY="false"
ALBAZ_FEATURE_WEBAUTHN_PASSKEYS="true"
NEXT_PUBLIC_ALBAZ_FEATURE_WEBAUTHN_PASSKEYS="true"
ALBAZ_WEBAUTHN_RP_NAME="ALBAZ Vendor"
ALBAZ_WEBAUTHN_RP_ID="localhost"
ALBAZ_WEBAUTHN_ORIGIN="http://localhost:3001"

# ==============================================
# BUSINESS CONFIGURATION
# ==============================================
DELIVERY_FEE="500"
TAX_RATE="0"
MAX_ORDER_ITEMS="50"
MAX_CART_VALUE="100000"

# ==============================================
# VENDOR STOREFRONTS / CUSTOM DOMAINS (take.app-style)
# ==============================================
# Apex domain used for vendor subdomains, e.g. "albazdelivery.com"
# Customers will reach a vendor at `<vendorSubdomain>.${BASE_DOMAIN}`.
BASE_DOMAIN="albazdelivery.com"

# CNAME target vendors should point their custom apex/www at. On Vercel this
# is typically "cname.vercel-dns.com".
CUSTOM_DOMAIN_CNAME_TARGET="cname.vercel-dns.com"

# Vercel Domains API — used to programmatically attach verified custom
# domains to the deployed project so Vercel issues SSL certs automatically.
# Leave blank locally; the app falls back to no-op provisioning.
# Docs: https://vercel.com/docs/rest-api/reference/endpoints/projects/add-a-domain-to-a-project
VERCEL_API_TOKEN=""
VERCEL_PROJECT_ID=""
# Only required when the project is owned by a Vercel team.
VERCEL_TEAM_ID=""
```

## Setup Instructions

1. **Copy to .env file:**
   ```bash
   # Create .env in project root
   cp ENV_TEMPLATE.md .env
   ```

2. **Generate secrets:**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate JWT_SECRET
   openssl rand -base64 32
   ```

3. **Required variables for local development:**
   - `DATABASE_URL` - PostgreSQL connection
   - `NEXTAUTH_SECRET` - Authentication secret
   - `NEXTAUTH_URL` - Application URL

4. **Optional but recommended:**
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` - For rate limiting
   - `GOOGLE_MAPS_API_KEY` - For delivery tracking
   - `SENTRY_DSN` - For error tracking

## Variable Categories

### 🔴 Critical (Required for app to run)
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 🟡 Important (Features may not work without these)
- `UPSTASH_REDIS_REST_URL` - Rate limiting falls back to in-memory
- `GOOGLE_MAPS_API_KEY` - Maps won't load
- `STRIPE_*` - Payment processing disabled

### 🟢 Optional (Nice to have)
- `GOOGLE_CLIENT_ID` - OAuth login
- `SENTRY_DSN` - Error tracking
- `SMTP_*` - Email notifications
- `BASE_DOMAIN` - Apex for vendor subdomain storefronts (`<slug>.${BASE_DOMAIN}`)
- `CUSTOM_DOMAIN_CNAME_TARGET` - CNAME target shown to vendors in DNS instructions
- `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` - Programmatic custom-domain provisioning on Vercel

## Security Notes

1. **NEVER commit `.env` files to git**
2. Use different secrets for dev/staging/production
3. Rotate secrets regularly in production
4. Store production secrets in secure vault (Vercel, AWS Secrets Manager, etc.)
5. Use strong, randomly generated secrets

## Getting API Keys

- **Upstash Redis**: https://console.upstash.com/
- **Google OAuth**: https://console.cloud.google.com/
- **Stripe**: https://dashboard.stripe.com/apikeys
- **Google Maps**: https://console.cloud.google.com/
- **Sentry**: https://sentry.io/
- **Twilio**: https://www.twilio.com/
- **Cloudinary**: https://cloudinary.com/

## Troubleshooting

### "Missing environment variable" error
- Check that variable is defined in `.env`
- Restart dev server after changing `.env`
- Verify no typos in variable names

### Redis connection fails
- Set `SKIP_REDIS_CONNECTION="true"` for local dev without Redis
- App will use in-memory rate limiting as fallback

### Database connection fails
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists: `createdb albazdelivery`


