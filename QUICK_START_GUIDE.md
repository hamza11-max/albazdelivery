# Quick Start Guide - AL-baz الباز

## 🚀 Getting Started (5 Minutes)

### Step 1: Environment Setup
```bash
# Run the setup script
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1
```

This will create `.env` and `.env.local` files with all required environment variables.

### Step 2: Activate Supabase Project
1. Go to https://supabase.com/dashboard
2. Select your project
3. If paused, click **"Restore"**
4. Wait 1-2 minutes for activation

### Step 3: Test Database Connection
```bash
# Test connection
powershell -ExecutionPolicy Bypass -File scripts/test-db-connection-enhanced.ps1
```

### Step 4: Run Migration
```bash
# Generate Prisma Client
npx prisma generate

# Run migration
npx prisma migrate dev --name init

# Or use db push (alternative)
npx prisma db push
```

### Step 5: Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run security tests
npm test -- __tests__/lib/security

# Run specific test suite
npm test -- __tests__/lib/security/csrf.test.ts
```

## 🔒 Security Features

### CSRF Protection
- Automatic token generation
- Token validation on all POST/PUT/PATCH/DELETE requests
- Client-side utilities available

### Security Headers
- X-Frame-Options: DENY
- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- CORS headers

### Audit Logging
- All security events logged to database
- Authentication events tracked
- Data access events tracked
- Admin actions tracked

## 📝 Validation

Validation schemas are available in `lib/validations/api.ts`:
- Orders
- Products
- Reviews
- Chat
- Support tickets
- Wallet
- Loyalty
- And more...

## 🔧 Troubleshooting

### Database Connection Issues
See: `DATABASE_CONNECTION_WORKAROUND.md`

### Security Issues
See: `SECURITY_IMPLEMENTATION_COMPLETE.md`

### General Issues
See: `IMPLEMENTATION_COMPLETE.md`

## 📚 Documentation

- `DATABASE_CONNECTION_WORKAROUND.md` - Database troubleshooting
- `SECURITY_IMPLEMENTATION_COMPLETE.md` - Security features
- `IMPLEMENTATION_COMPLETE.md` - Complete implementation summary
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Detailed summary

---

**Ready to start?** Run the setup script and activate your Supabase project!

