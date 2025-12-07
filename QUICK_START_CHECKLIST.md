# 🚀 Quick Start Checklist - AL-baz الباز

## Immediate Actions (Week 1)

### 🔴 Critical Setup
- [ ] Create `.env.local` file with all required environment variables
- [ ] Set up PostgreSQL database (local or cloud)
- [ ] Install and configure Prisma ORM
- [ ] Set up NextAuth.js for authentication
- [ ] Configure CORS and security headers
- [ ] Add input validation with Zod on all API routes

### 🟡 High Priority
- [ ] Replace mock data in `lib/db.ts` with real database queries
- [ ] Implement proper error handling in API routes
- [ ] Add loading states and skeletons throughout the app
- [ ] Configure Vercel deployment settings
- [ ] Set up Git workflow (develop, staging, main branches)
- [ ] Create `package.json` scripts for development workflow

### 🟢 Nice to Have
- [ ] Add comprehensive README with setup instructions
- [ ] Create component documentation
- [ ] Add prettier and ESLint configuration
- [ ] Set up Git hooks with Husky
- [ ] Add changelog file
- [ ] Create contributing guidelines

---

## Environment Variables Template

Create `.env.local` in root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/albazdelivery"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Redis (Optional for Phase 1)
REDIS_URL="redis://localhost:6379"

# Email (for OTP/Notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# SMS (Optional for Phase 1)
SMS_API_KEY="your-sms-api-key"

# Payment Gateway (Phase 2)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Maps (Phase 2)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# File Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

---

## Installation Commands

```bash
# Install dependencies
pnpm install

# Set up Prisma
pnpm add -D prisma
pnpm add @prisma/client
npx prisma init

# Set up NextAuth
pnpm add next-auth@beta @auth/prisma-adapter

# Testing framework
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event jest-environment-jsdom

# Code quality tools
pnpm add -D eslint prettier husky lint-staged

# Additional utilities
pnpm add bcryptjs date-fns zod
pnpm add -D @types/bcryptjs
```

---

## Database Schema Setup

### 1. Create Prisma Schema

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String   @unique
  password  String
  role      Role     @default(CUSTOMER)
  status    ApprovalStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Role-specific fields
  licenseNumber String?
  shopType      String?
  
  // Relations
  orders        Order[]
  reviews       Review[]
  loyaltyAccount LoyaltyAccount?
  wallet        Wallet?
  
  @@index([email])
  @@index([phone])
}

enum Role {
  CUSTOMER
  VENDOR
  DRIVER
  ADMIN
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model Order {
  id              String   @id @default(cuid())
  customerId      String
  storeId         String
  status          OrderStatus @default(PENDING)
  total           Float
  subtotal        Float
  deliveryFee     Float
  paymentMethod   PaymentMethod
  deliveryAddress String
  city            String
  customerPhone   String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  customer User @relation(fields: [customerId], references: [id])
  items    OrderItem[]
  payment  Payment?
  
  @@index([customerId])
  @@index([status])
}

enum OrderStatus {
  PENDING
  ACCEPTED
  PREPARING
  READY
  ASSIGNED
  IN_DELIVERY
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  CASH
  CARD
  WALLET
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Float
  
  order Order @relation(fields: [orderId], references: [id])
  
  @@index([orderId])
}

model LoyaltyAccount {
  id                   String   @id @default(cuid())
  customerId           String   @unique
  points               Int      @default(0)
  totalPointsEarned    Int      @default(0)
  totalPointsRedeemed  Int      @default(0)
  tier                 MembershipTier @default(BRONZE)
  referralCode         String   @unique
  referralCount        Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  customer User @relation(fields: [customerId], references: [id])
  
  @@index([referralCode])
}

enum MembershipTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

model Wallet {
  id           String   @id @default(cuid())
  customerId   String   @unique
  balance      Float    @default(0)
  totalSpent   Float    @default(0)
  totalEarned  Float    @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  customer User @relation(fields: [customerId], references: [id])
}

model Payment {
  id            String   @id @default(cuid())
  orderId       String   @unique
  amount        Float
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  transactionId String?
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  
  order Order @relation(fields: [orderId], references: [id])
  
  @@index([status])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model Review {
  id          String   @id @default(cuid())
  customerId  String
  vendorId    String
  orderId     String
  rating      Int
  comment     String
  helpful     Int      @default(0)
  unhelpful   Int      @default(0)
  createdAt   DateTime @default(now())
  
  customer User @relation(fields: [customerId], references: [id])
  
  @@index([vendorId])
  @@index([rating])
}
```

### 2. Run Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

---

## Critical Files to Update

### Priority Order:

1. **lib/db.ts** - Replace mock data with Prisma queries
2. **lib/auth-context.tsx** - Integrate NextAuth
3. **app/api/auth/[...nextauth]/route.ts** - Create NextAuth handler
4. **All API routes** - Add database integration
5. **middleware.ts** - Add authentication middleware

---

## Testing Setup

### 1. Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 2. Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

### 3. Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Code Quality Setup

### 1. `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn"
  }
}
```

### 2. `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 120
}
```

### 3. `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### 4. `package.json` (add):

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## Deployment Checklist

### Vercel Deployment:

- [ ] Connect GitHub repository
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure build settings
- [ ] Set up custom domain (optional)
- [ ] Enable analytics
- [ ] Configure preview deployments

### Pre-deployment:

- [ ] Run `pnpm build` locally to check for errors
- [ ] Test all critical user flows
- [ ] Check mobile responsiveness
- [ ] Verify all API endpoints work
- [ ] Test authentication flow
- [ ] Check error handling

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Sanitize user inputs
- [ ] Use parameterized queries
- [ ] Add security headers
- [ ] Implement proper CORS
- [ ] Regular dependency updates

---

## Performance Checklist

- [ ] Use Next.js Image component for all images
- [ ] Implement lazy loading for components
- [ ] Enable static generation where possible
- [ ] Optimize bundle size
- [ ] Use CDN for static assets
- [ ] Implement caching strategy
- [ ] Minimize API calls
- [ ] Add loading states
- [ ] Optimize database queries
- [ ] Enable compression

---

## Documentation Checklist

- [ ] Update README with setup instructions
- [ ] Document API endpoints
- [ ] Create architecture diagram
- [ ] Document environment variables
- [ ] Create user guides
- [ ] Document database schema
- [ ] Add inline code comments
- [ ] Create deployment guide
- [ ] Document troubleshooting steps

---

## Monitoring & Analytics

### Set up:

- [ ] Vercel Analytics
- [ ] Google Analytics
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Log aggregation

---

## Weekly Goals Template

### Week 1:
- [ ] Environment setup complete
- [ ] Database integrated
- [ ] Authentication working
- [ ] Basic tests written

### Week 2:
- [ ] All API routes migrated to database
- [ ] Error handling improved
- [ ] Deployment pipeline working
- [ ] 30% test coverage achieved

### Week 3:
- [ ] Security hardening complete
- [ ] Performance optimizations done
- [ ] Documentation updated
- [ ] Ready for beta launch

---

## Resources & Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

## Common Issues & Solutions

### Issue: Prisma Client not found
**Solution**: Run `npx prisma generate`

### Issue: Database connection failed
**Solution**: Check DATABASE_URL in .env.local

### Issue: NextAuth not working
**Solution**: Ensure NEXTAUTH_SECRET and NEXTAUTH_URL are set

### Issue: Build fails on Vercel
**Solution**: Check environment variables in Vercel dashboard

---

**Print this checklist and track your progress!** ✅
