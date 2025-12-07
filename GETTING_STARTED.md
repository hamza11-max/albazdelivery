# 🚀 Getting Started with AL-baz الباز

**Welcome!** This guide will get you up and running in 10 minutes.

---

## ⚡ Super Quick Start

```powershell
# 1. Run automated setup
.\setup.ps1

# 2. Start development server
pnpm dev

# 3. Open browser
http://localhost:3000

# 4. Login
Email: admin@albazdelivery.com
Password: Admin123!
```

**That's it!** 🎉

---

## 📋 What You Have Now

### ✅ **16 Working API Routes** (30% Complete)

#### 🔐 Authentication
- Register users (customers auto-approved)
- Login with NextAuth.js
- Role-based access (customer, vendor, driver, admin)

#### 📦 Orders
- Create orders with automatic loyalty points
- View orders based on user role
- Orders persist in PostgreSQL

#### 🛍️ Products
- Browse products with search & filters
- Vendors can toggle availability
- Sorted by rating and availability

#### 🚗 Driver Operations
- View available deliveries
- Accept delivery assignments
- Automatic customer notifications

#### 💰 Wallet System
- Check balance (auto-creates if needed)
- Add/deduct funds with validation
- Transaction history

#### 🎁 Loyalty Program
- View points and tier (Bronze → Platinum)
- Automatic tier upgrades
- Points awarded on orders (5%)

#### 🔔 Notifications
- View notifications with pagination
- Mark as read (single or all)
- Delete notifications

#### 👑 Admin Panel
- Approve vendor/driver registrations
- User management with pagination
- Auto-creates stores for vendors

---

## 🎯 Your First 5 Minutes

### Step 1: Register a Customer (1 minute)
1. Go to http://localhost:3000/signup
2. Fill in the form with role: **Customer**
3. Click register → **Auto-approved!**
4. You now have a loyalty account with 0 points
5. You now have a wallet with 0 balance

### Step 2: Browse Products (1 minute)
1. Go to a store page
2. Search for products
3. Filter by category
4. Products are sorted by rating

### Step 3: Create an Order (2 minutes)
1. Add products to cart
2. Checkout
3. Order is created in database
4. **Automatic**: 5% loyalty points awarded
5. **Automatic**: Notification sent
6. Order status: PENDING

### Step 4: Admin Approves Vendor (1 minute)
1. Logout and login as admin:
   - Email: `admin@albazdelivery.com`
   - Password: `Admin123!`
2. Go to admin panel
3. View pending registrations
4. Approve a vendor
5. **Automatic**: Store created for vendor
6. **Automatic**: Vendor can now manage products

### Step 5: Driver Accepts Delivery (1 minute)
1. Order needs to be in READY status first (vendor confirms)
2. Login as driver:
   - Email: `driver@test.com`
   - Password: `Driver123!`
3. View available deliveries
4. Accept delivery
5. **Automatic**: Order status → ASSIGNED
6. **Automatic**: Customer notification sent

---

## 🗺️ Project Tour

### Database (Prisma Studio)
```powershell
pnpm db:studio
# Opens http://localhost:5555
```

**Explore**:
- **User** - All registered users
- **Order** - All orders with items
- **Product** - Product catalog
- **Wallet** - Customer wallets
- **LoyaltyAccount** - Points and tiers
- **Notification** - All notifications
- **30+ more tables!**

### API Routes (Postman/curl)
```bash
# Get orders (requires auth)
curl http://localhost:3000/api/orders \
  -H "Cookie: your-session-cookie"

# Get products
curl http://localhost:3000/api/products?storeId=xxx

# Get notifications
curl http://localhost:3000/api/notifications
```

### Documentation
All docs are in the root folder:
- **START_HERE.md** - Quick reference
- **SESSION_SUMMARY.md** - What's been built
- **API_MIGRATION_STATUS.md** - Track progress
- **WHATS_NEXT.md** - What to build next

---

## 🎓 Understanding the Code

### Authentication Flow
```typescript
// 1. User registers
POST /api/auth/register
→ Password hashed with bcrypt
→ Customer: Auto-approved + loyalty + wallet created
→ Vendor/Driver: Admin approval required

// 2. User logs in
POST /api/auth/signin (NextAuth)
→ JWT token created (30-day session)
→ Token includes: id, role, email

// 3. Protected routes check session
const session = await auth()
if (!session?.user) throw UnauthorizedError()
```

### Order Creation Flow
```typescript
// 1. Customer creates order
POST /api/orders
→ Validates store is active
→ Creates order + items (atomic transaction)
→ Awards loyalty points (5% of total)
→ Creates loyalty transaction record
→ Sends notification
→ Emits SSE event

// 2. Vendor accepts order
PATCH /api/orders/[id]/status
→ Status: PENDING → ACCEPTED

// 3. Vendor prepares order
PATCH /api/orders/[id]/status
→ Status: ACCEPTED → PREPARING → READY

// 4. Driver accepts delivery
POST /api/drivers/deliveries
→ Status: READY → ASSIGNED
→ Driver assigned to order
→ Customer notified

// 5. Driver delivers
PATCH /api/drivers/deliveries/[id]/status
→ Status: ASSIGNED → IN_DELIVERY → DELIVERED
```

### Loyalty Points Flow
```typescript
// 1. Points earned on order
Order total: 1000 DA
→ Points earned: 50 (5%)
→ Loyalty account updated
→ Transaction recorded

// 2. Tier calculated
Total points earned:
- 0-1,999: Bronze
- 2,000-4,999: Silver
- 5,000-9,999: Gold
- 10,000+: Platinum

// 3. Points redeemed
Customer redeems reward
→ Points deducted
→ Discount applied
→ Transaction recorded
```

---

## 🔧 Common Tasks

### Add a New API Route
```typescript
// 1. Create file
// app/api/your-route/route.ts

// 2. Copy pattern from existing route
// app/api/orders/route.ts

// 3. Replace mock data with Prisma
const data = await prisma.model.findMany()

// 4. Test
pnpm dev
curl http://localhost:3000/api/your-route
```

### Update Database Schema
```typescript
// 1. Edit prisma/schema.prisma
model NewModel {
  id String @id @default(cuid())
  // ... fields
}

// 2. Push changes
pnpm db:push

// 3. Generate client
pnpm db:generate

// 4. Use in code
await prisma.newModel.create({...})
```

### Add Validation
```typescript
// 1. Create schema in lib/validations/
import { z } from 'zod'

export const mySchema = z.object({
  field: z.string().min(1),
})

// 2. Use in API route
const data = mySchema.parse(body)
```

### Add Test
```typescript
// 1. Create test file
// __tests__/api/your-route.test.ts

describe('POST /api/your-route', () => {
  it('should create resource', async () => {
    // Test implementation
  })
})

// 2. Run tests
pnpm test
```

---

## 📊 Monitor Your App

### Check Logs
```powershell
# Development server logs
pnpm dev
# Shows all API calls and errors

# Database queries (Prisma logs)
# Enabled in development mode
# Shows SQL queries executed
```

### Database Queries
```powershell
# Prisma Studio
pnpm db:studio

# Or use SQL directly
psql -h localhost -U postgres -d albazdelivery
```

### Test Coverage
```powershell
pnpm test:coverage
# Opens coverage report
# Target: 70% coverage
```

---

## 🐛 Troubleshooting

### "Prisma Client not found"
```powershell
pnpm db:generate
```

### "Can't connect to database"
1. Check `DATABASE_URL` in `.env.local`
2. Verify PostgreSQL is running
3. Test connection: `psql -h localhost -U postgres`

### "Session is null"
1. Check if logged in
2. Check `NEXTAUTH_SECRET` in `.env.local`
3. Clear cookies and login again

### "Module not found"
```powershell
rm -rf node_modules .next
pnpm install
```

### "Port 3000 in use"
```powershell
# Kill process
npx kill-port 3000

# Or use different port
pnpm dev -- -p 3001
```

---

## 🎯 Next Steps

### This Week:
1. [ ] Test all 16 migrated routes
2. [ ] Migrate 10 more routes (see API_MIGRATION_STATUS.md)
3. [ ] Update frontend auth to use NextAuth
4. [ ] Write tests for order flow

### Next Week:
5. [ ] Migrate payment routes
6. [ ] Implement review system
7. [ ] Add chat functionality
8. [ ] Deploy to staging

### Full Roadmap:
See **[IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md)** for 6-month plan

---

## 📚 Learn More

### Technologies Used:
- **Next.js 15**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://www.prisma.io/docs)
- **NextAuth.js**: [next-auth.js.org](https://next-auth.js.org)
- **Zod**: [zod.dev](https://zod.dev)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org)

### Useful Resources:
- **Prisma Examples**: [github.com/prisma/prisma-examples](https://github.com/prisma/prisma-examples)
- **NextAuth Examples**: [next-auth.js.org/getting-started/example](https://next-auth.js.org/getting-started/example)
- **Next.js App Router**: [nextjs.org/docs/app](https://nextjs.org/docs/app)

---

## 💬 Tips & Tricks

### 🔥 Hot Reload
Changes to these files auto-reload:
- ✅ `.tsx` / `.ts` files
- ✅ API routes
- ✅ Components
- ❌ `.env.local` (restart required)
- ❌ `prisma/schema.prisma` (run `pnpm db:generate`)

### 🚀 Fast Development
```powershell
# Terminal 1: Dev server
pnpm dev

# Terminal 2: Database browser
pnpm db:studio

# Terminal 3: Tests in watch mode
pnpm test:watch
```

### 🐛 Debug Mode
```typescript
// Add to any route
console.log('[DEBUG]', data)

// Or use debugger
debugger
```

### 📦 Database Helpers
```typescript
// Get all data
const all = await prisma.model.findMany()

// Get one
const one = await prisma.model.findUnique({ where: { id } })

// Create
const created = await prisma.model.create({ data: {...} })

// Update
const updated = await prisma.model.update({
  where: { id },
  data: {...}
})

// Delete
await prisma.model.delete({ where: { id } })

// Count
const count = await prisma.model.count()
```

---

## 🎊 You're Ready!

You now have:
- ✅ **Working app** with 16 API routes
- ✅ **Production database** (PostgreSQL)
- ✅ **Secure authentication** (NextAuth.js)
- ✅ **Comprehensive docs** (3,500+ lines)
- ✅ **Testing setup** (Jest + RTL)
- ✅ **Development tools** (Prisma Studio, etc.)

**Start building!** 🚀

---

## 📞 Quick Links

| Resource | Link |
|----------|------|
| **Quick Start** | Run `.\setup.ps1` |
| **Documentation** | [START_HERE.md](START_HERE.md) |
| **API Status** | [API_MIGRATION_STATUS.md](API_MIGRATION_STATUS.md) |
| **Next Steps** | [WHATS_NEXT.md](WHATS_NEXT.md) |
| **Roadmap** | [IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md) |
| **Help** | [SETUP_GUIDE.md](SETUP_GUIDE.md) |

---

**Made with ❤️ for Algeria** 🇩🇿  
**Happy coding!** 🎉
