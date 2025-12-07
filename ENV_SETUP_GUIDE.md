# Environment Variables Setup Guide

This guide explains how to configure environment variables for the AL-baz Delivery Platform monorepo.

## 📋 Overview

The monorepo uses environment variables for:
- Database connections (PostgreSQL via Prisma)
- Authentication (NextAuth.js)
- Caching and rate limiting (Redis)
- OAuth providers (Google)
- Security settings (CORS, etc.)

## 🚀 Quick Start

### 1. Root Level Configuration

Copy the root `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values.

### 2. App-Specific Configuration

Each app can have its own `.env.local` file:

```bash
# Customer app
cp apps/customer/.env.example apps/customer/.env.local

# Vendor app
cp apps/vendor/.env.example apps/vendor/.env.local

# Driver app
cp apps/driver/.env.example apps/driver/.env.local

# Admin app
cp apps/admin/.env.example apps/admin/.env.local
```

## 🔑 Required Variables

### Essential (Must Have)

#### `DATABASE_URL`
PostgreSQL connection string for Prisma.

**Format:**
```
postgresql://user:password@host:port/database?schema=public
```

**Example:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/albazdelivery?schema=public
```

**How to get:**
- Local: Use your local PostgreSQL instance
- Production: Get from your hosting provider (Vercel, Railway, Supabase, etc.)

#### `NEXTAUTH_SECRET`
Secret key for NextAuth.js session encryption.

**Generate:**
```bash
openssl rand -base64 32
```

**Example:**
```
NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Important:** Use a different secret for each environment (dev, staging, production).

#### `NEXTAUTH_URL`
Base URL of your application.

**Development:**
```
NEXTAUTH_URL=http://localhost:3000
```

**Production:**
```
NEXTAUTH_URL=https://app.albazdelivery.com
```

**Per App:**
- Customer: `http://localhost:3000` or `https://app.albazdelivery.com`
- Vendor: `http://localhost:3001` or `https://vendor.albazdelivery.com`
- Driver: `http://localhost:3002` or `https://driver.albazdelivery.com`
- Admin: `http://localhost:3003` or `https://admin.albazdelivery.com`

## 🔧 Optional Variables

### OAuth Providers

#### Google OAuth (for social login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)

**Variables:**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Redis Configuration

Redis is used for caching and rate limiting. You can use one of these options:

#### Option 1: Redis URL (Upstash, Redis Cloud, etc.)

```
REDIS_URL=redis://default:password@host:port
REDIS_TOKEN=your-redis-token
```

#### Option 2: Local Redis

```
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Option 3: Upstash Redis REST API

1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Get REST URL and token

```
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

**Note:** Redis is optional. The app will work without it, but caching and rate limiting will be disabled.

### Security Configuration

#### `ALLOWED_ORIGINS`
Comma-separated list of allowed origins for CORS.

**Development:**
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```

**Production:**
```
ALLOWED_ORIGINS=https://app.albazdelivery.com,https://vendor.albazdelivery.com,https://driver.albazdelivery.com,https://admin.albazdelivery.com
```

## 📁 File Structure

```
albazdelivery/
├── .env                    # Root level (shared)
├── .env.example            # Root template
├── apps/
│   ├── customer/
│   │   ├── .env.local     # Customer app specific
│   │   └── .env.example   # Customer template
│   ├── vendor/
│   │   ├── .env.local     # Vendor app specific
│   │   └── .env.example   # Vendor template
│   ├── driver/
│   │   ├── .env.local     # Driver app specific
│   │   └── .env.example   # Driver template
│   └── admin/
│       ├── .env.local     # Admin app specific
│       └── .env.example   # Admin template
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
   - `.env` is in `.gitignore`
   - Only commit `.env.example` files

2. **Use different secrets for each environment**
   - Development: `NEXTAUTH_SECRET_DEV`
   - Staging: `NEXTAUTH_SECRET_STAGING`
   - Production: `NEXTAUTH_SECRET_PROD`

3. **Rotate secrets regularly**
   - Change `NEXTAUTH_SECRET` periodically
   - Update database passwords regularly

4. **Use environment-specific URLs**
   - Development: `localhost`
   - Staging: `staging.albazdelivery.com`
   - Production: `albazdelivery.com`

## 🚀 Deployment

### Vercel

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - etc.

4. Set environment-specific values:
   - Development: `localhost` URLs
   - Preview: Staging URLs
   - Production: Production URLs

### Other Platforms

Most platforms support environment variables:
- **Railway**: Project Settings → Variables
- **Render**: Environment → Environment Variables
- **Heroku**: Settings → Config Vars
- **DigitalOcean**: App Settings → Environment Variables

## 🧪 Testing Configuration

### Verify Environment Variables

Create a test script to verify your configuration:

```typescript
// scripts/check-env.ts
const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
]

const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:')
  missing.forEach(key => console.error(`  - ${key}`))
  process.exit(1)
}

console.log('✅ All required environment variables are set')
```

## 📝 Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Node environment |
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | **Yes** | - | NextAuth.js secret key |
| `NEXTAUTH_URL` | **Yes** | - | Application base URL |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret |
| `REDIS_URL` | No | - | Redis connection URL |
| `REDIS_TOKEN` | No | - | Redis authentication token |
| `REDIS_HOST` | No | `localhost` | Redis host (local) |
| `REDIS_PORT` | No | `6379` | Redis port (local) |
| `UPSTASH_REDIS_REST_URL` | No | - | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | - | Upstash Redis REST token |
| `ALLOWED_ORIGINS` | No | - | Comma-separated CORS origins |

## 🆘 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is running
- Check network/firewall settings

### "NextAuth secret is missing"
- Generate a new secret: `openssl rand -base64 32`
- Add to `.env` file
- Restart development server

### "Invalid redirect URI" (OAuth)
- Check `NEXTAUTH_URL` matches your app URL
- Verify redirect URI in OAuth provider settings
- Ensure protocol matches (http vs https)

### "Redis connection failed"
- Redis is optional - app will work without it
- Check Redis credentials if using
- Verify Redis server is running (if local)

## 📚 Additional Resources

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options)
- [Prisma Environment Variables](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-strings)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Need Help?** Check the main [README.md](./README.md) or [MONOREPO_NEXT_STEPS.md](./MONOREPO_NEXT_STEPS.md)

