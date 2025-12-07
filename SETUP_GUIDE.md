# 🚀 AL-baz الباز - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or later
- **pnpm** 8.x or later (or npm/yarn)
- **PostgreSQL** 14.x or later (local or cloud instance)
- **Git**

---

## Step 1: Clone & Install Dependencies

```bash
# Navigate to project directory
cd e:\nn\albazdelivery

# Install dependencies
pnpm install

# This will install all required packages including:
# - Prisma & @prisma/client
# - NextAuth.js v5
# - bcryptjs for password hashing
# - Zod for validation
# - And all existing dependencies
```

---

## Step 2: Database Setup

### Option A: Local PostgreSQL

1. **Install PostgreSQL** if you haven't already
2. **Create a new database**:
```sql
CREATE DATABASE albazdelivery;
```

3. **Create `.env.local` file** in the project root:
```bash
# Copy from .env.example
cp .env.example .env.local
```

4. **Update DATABASE_URL** in `.env.local`:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/albazdelivery"
```

### Option B: Supabase (Recommended for Quick Start)

1. **Go to** [supabase.com](https://supabase.com) and create a new project
2. **Get your database connection string** from Project Settings > Database
3. **Update `.env.local`**:
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

---

## Step 3: Configure Environment Variables

Edit `.env.local` and add required variables:

```bash
# Required for authentication
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Required for database
DATABASE_URL="your-database-url"

# Optional (but recommended)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### Generate NEXTAUTH_SECRET:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Step 4: Initialize Database

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Or run migrations (recommended for production)
pnpm db:migrate

# (Optional) Open Prisma Studio to view database
pnpm db:studio
```

---

## Step 5: Seed Database (Optional)

Create `prisma/seed.ts` for initial data:

```typescript
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hashPassword('Admin123!')
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@albazdelivery.com',
      phone: '0551234567',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      city: 'Algiers',
    },
  })

  console.log('Admin created:', admin.email)

  // Create test customer
  const customerPassword = await hashPassword('Customer123!')
  const customer = await prisma.user.create({
    data: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '0661234567',
      password: customerPassword,
      role: 'CUSTOMER',
      status: 'APPROVED',
      city: 'Algiers',
      loyaltyAccount: {
        create: {},
      },
      wallet: {
        create: {
          balance: 1000,
        },
      },
    },
  })

  console.log('Customer created:', customer.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Then run:
```bash
pnpm db:seed
```

---

## Step 6: Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 7: Test Authentication

### Login Credentials (after seeding):
- **Admin**: admin@albazdelivery.com / Admin123!
- **Customer**: customer@test.com / Customer123!

### Register New User:
1. Go to `/signup`
2. Fill in the form
3. **Customers** are auto-approved
4. **Vendors/Drivers** need admin approval at `/admin`

---

## Troubleshooting

### Issue: "Can't reach database server"
**Solution**: Check your DATABASE_URL and ensure PostgreSQL is running
```bash
# Check if PostgreSQL is running (Linux/Mac)
pg_isready

# Check connection
psql -h localhost -U postgres
```

### Issue: "Prisma Client not found"
**Solution**: Generate Prisma Client
```bash
pnpm db:generate
```

### Issue: "Module not found"
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
pnpm install
```

### Issue: "NEXTAUTH_SECRET missing"
**Solution**: Add to `.env.local`
```bash
NEXTAUTH_SECRET="your-generated-secret"
```

---

## Project Structure

```
albazdelivery/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── orders/       # Order management
│   │   ├── payments/     # Payment processing
│   │   └── ...
│   ├── admin/            # Admin dashboard
│   ├── vendor/           # Vendor portal
│   ├── driver/           # Driver app
│   └── page.tsx          # Customer homepage
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                   # Utilities & configuration
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth setup
│   ├── auth.config.ts    # Auth configuration
│   ├── errors.ts         # Error handling
│   ├── password.ts       # Password utilities
│   ├── rate-limit.ts     # Rate limiting
│   └── validations/      # Zod schemas
├── prisma/
│   └── schema.prisma     # Database schema
├── .env.example          # Environment template
└── package.json
```

---

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Testing (coming soon)
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report

# Type Checking
pnpm type-check       # Check TypeScript types
```

---

## Next Steps

After successful setup:

1. ✅ **Review the roadmap**: Check `IMPROVEMENT_ROADMAP.md`
2. ✅ **Read technical debt analysis**: See `TECHNICAL_DEBT_ANALYSIS.md`
3. ✅ **Follow the checklist**: Use `QUICK_START_CHECKLIST.md`
4. ✅ **Start migrating API routes**: Replace mock data with Prisma queries
5. ✅ **Add tests**: Write tests for critical flows
6. ✅ **Configure production**: Set up Vercel deployment

---

## Production Deployment (Vercel)

### Prepare for Production:

1. **Update environment variables** in Vercel dashboard
2. **Set up production database** (Supabase Pro recommended)
3. **Configure custom domain**
4. **Enable analytics & monitoring**
5. **Set up error tracking** (Sentry)

### Deployment Steps:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
# ... add all required variables

# Deploy to production
vercel --prod
```

---

## Security Checklist

Before going live:

- [ ] All environment variables in `.env.local` (not committed)
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Rate limiting configured
- [ ] Input validation on all API routes
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Error messages don't leak sensitive info

---

## Support & Resources

- **Documentation**: See `IMPROVEMENT_ROADMAP.md`
- **Issues**: Check `TECHNICAL_DEBT_ANALYSIS.md`
- **API Reference**: Coming soon in Phase 6

### Helpful Links:
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Vercel Docs](https://vercel.com/docs)

---

**Ready to build! 🚀**

If you encounter any issues, refer to the troubleshooting section or check the documentation files.
