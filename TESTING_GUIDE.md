# 🧪 API Testing Guide

## 🚀 Quick Start

### Option 1: Use REST Client (VS Code Extension)

1. **Install Extension**:
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "REST Client"
   - Install by Huachao Mao

2. **Open Test File**:
   - Open `test-api.http`
   - You'll see all API endpoints

3. **Start Dev Server**:
   ```powershell
   pnpm dev
   ```

4. **Test Registration** (First test - no auth needed):
   - Find the "Register a new customer" section
   - Click "Send Request" above the POST line
   - You should see a successful response

5. **Test Login**:
   - Find the "Login" section
   - Update credentials if needed
   - Click "Send Request"
   - Copy the JWT token from response

6. **Add Token**:
   - Go to top of file
   - Replace `@authToken = your-jwt-token-here` with your actual token
   - Now all other requests will work!

---

### Option 2: Use Postman

1. **Install Postman**: Download from https://postman.com

2. **Import Collection**:
   - Create new collection "AL-baz API"
   - Copy requests from `test-api.http`
   - Set baseUrl variable: `http://localhost:3000`

3. **Setup Authorization**:
   - Collection → Authorization
   - Type: Bearer Token
   - Token: (paste your JWT after login)

4. **Test Endpoints**:
   - Start with `/api/auth/register`
   - Then `/api/auth/signin`
   - Then protected routes

---

### Option 3: Use curl (PowerShell)

```powershell
# Test health/ping
curl http://localhost:3000/api/health

# Register a customer
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"name\": \"Test User\",
    \"email\": \"test@example.com\",
    \"phone\": \"0551234567\",
    \"password\": \"Password123!\",
    \"role\": \"CUSTOMER\",
    \"city\": \"Algiers\"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/signin `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"admin@albazdelivery.com\",
    \"password\": \"Admin123!\"
  }'

# Get orders (replace TOKEN with your JWT)
curl http://localhost:3000/api/orders `
  -H "Authorization: Bearer TOKEN"
```

---

## 🗄️ Database Setup (Required)

**You need a database connection first!** Choose one:

### Quick Option 1: Supabase (Free, 2 minutes)

1. Go to https://supabase.com/dashboard
2. Create new project
3. Wait for provisioning (~2 min)
4. Settings → Database → Connection Pooling
5. Copy the URI
6. Add to `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres.xxx:password@xxx.supabase.co:6543/postgres"
   ```
7. Run:
   ```powershell
   pnpm db:push
   pnpm db:seed
   ```

### Quick Option 2: Neon.tech (Free, faster)

1. Go to https://neon.tech
2. Sign up (GitHub login works)
3. Create project (instant!)
4. Copy connection string
5. Add to `.env`
6. Run `pnpm db:push` and `pnpm db:seed`

### Quick Option 3: ElephantSQL (Free)

1. Go to https://www.elephantsql.com
2. Create free "Tiny Turtle" instance
3. Copy URL
4. Add to `.env`
5. Run setup commands

---

## 🧪 Test Scenarios

### Scenario 1: Customer Journey

```http
1. POST /api/auth/register (role: CUSTOMER)
   → Customer is auto-approved
   
2. POST /api/auth/signin
   → Get JWT token
   
3. GET /api/products
   → Browse available products
   
4. POST /api/orders
   → Create order (5% loyalty points awarded automatically)
   
5. GET /api/loyalty/account
   → Check loyalty points
   
6. GET /api/wallet/balance
   → Check wallet (auto-created)
   
7. GET /api/notifications
   → See order notifications
```

### Scenario 2: Vendor Onboarding

```http
1. POST /api/auth/register (role: VENDOR)
   → Goes to pending status
   
2. Login as admin
   → POST /api/auth/signin (admin@albazdelivery.com)
   
3. GET /api/admin/registration-requests
   → See pending vendor request
   
4. POST /api/admin/registration-requests (action: approve)
   → Vendor approved, store auto-created
   
5. Login as vendor
   → Access granted
   
6. GET /api/orders (as vendor)
   → See store orders
   
7. PATCH /api/products
   → Toggle product availability
```

### Scenario 3: Driver Workflow

```http
1. POST /api/auth/register (role: DRIVER)
   → Pending approval
   
2. Admin approves
   → POST /api/admin/registration-requests
   
3. Login as driver
   → JWT token
   
4. GET /api/drivers/deliveries?available=true
   → See available deliveries (READY status)
   
5. POST /api/drivers/deliveries
   → Accept delivery (order status → ASSIGNED)
   
6. Customer gets notification
   → Automatic
```

### Scenario 4: Admin Operations

```http
1. Login as admin
   
2. GET /api/admin/users?role=VENDOR&status=APPROVED
   → View all approved vendors
   
3. GET /api/admin/registration-requests?status=PENDING
   → See pending requests
   
4. POST /api/wallet/balance (add funds)
   → Top up customer wallet
   
5. POST /api/loyalty/account (add points)
   → Award bonus loyalty points
```

---

## 🔍 Expected Responses

### Success Response Format:
```json
{
  "success": true,
  "data": {
    // Your data here
  },
  "meta": {
    "timestamp": "2025-10-20T14:30:00.000Z",
    "requestId": "uuid-here"
  }
}
```

### Error Response Format:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in"
  },
  "meta": {
    "timestamp": "2025-10-20T14:30:00.000Z",
    "requestId": "uuid-here"
  }
}
```

---

## 🎯 Testing Checklist

### Authentication ✅
- [ ] Register customer (auto-approved)
- [ ] Register vendor (pending)
- [ ] Register driver (pending)
- [ ] Login with credentials
- [ ] Access protected route with token
- [ ] Access fails without token

### Orders ✅
- [ ] Create order as customer
- [ ] View own orders
- [ ] Loyalty points awarded (5%)
- [ ] Vendor sees store orders
- [ ] Driver sees available orders
- [ ] Admin sees all orders

### Products ✅
- [ ] Browse all products
- [ ] Search products
- [ ] Filter by category
- [ ] Filter by store
- [ ] Vendor updates availability
- [ ] Customer cannot update products

### Drivers ✅
- [ ] View available deliveries (READY status)
- [ ] Accept delivery
- [ ] Order status changes to ASSIGNED
- [ ] Customer notified
- [ ] Cannot accept already assigned order

### Wallet ✅
- [ ] Get balance (auto-creates if needed)
- [ ] Add funds (admin)
- [ ] Deduct funds (admin)
- [ ] Cannot deduct more than balance
- [ ] Transaction history recorded

### Loyalty ✅
- [ ] Get account (auto-creates if needed)
- [ ] Points awarded on order (5%)
- [ ] Tier calculated (Bronze → Platinum)
- [ ] Admin can adjust points
- [ ] Transaction history tracked

### Notifications ✅
- [ ] View all notifications
- [ ] Filter unread only
- [ ] Pagination works
- [ ] Mark single as read
- [ ] Mark all as read
- [ ] Delete notification

### Admin ✅
- [ ] View all users
- [ ] Filter by role
- [ ] Filter by status
- [ ] Pagination works
- [ ] View pending requests
- [ ] Approve vendor (store created)
- [ ] Approve driver (performance record created)
- [ ] Reject request

---

## 🚨 Common Issues

### "Database connection failed"
→ Check `.env` has valid `DATABASE_URL`
→ Run `pnpm db:push` first

### "Unauthorized"
→ Token expired or invalid
→ Login again to get new token

### "Rate limit exceeded"
→ Wait 1 minute (100 requests/min limit)
→ Or restart dev server to reset

### "Validation error"
→ Check request body matches schema
→ Phone must be Algerian format (05/06/07 + 8 digits)
→ Password needs: 8+ chars, uppercase, lowercase, number

### "Port 3000 in use"
→ `npx kill-port 3000`
→ Or use different port: `pnpm dev -- -p 3001`

---

## 📊 Performance Testing

### Load Test (optional)
```powershell
# Install artillery
npm install -g artillery

# Create test file: artillery.yml
# Run load test
artillery run artillery.yml
```

### Rate Limit Test
```powershell
# Hit endpoint 150 times (should fail after 100)
for ($i=1; $i -le 150; $i++) {
  curl http://localhost:3000/api/products
  Write-Host "Request $i"
}
```

---

## ✅ When Testing is Complete

You should have verified:
- ✅ All 16 API routes work
- ✅ Authentication flow works
- ✅ Role-based access works
- ✅ Validation catches errors
- ✅ Rate limiting works
- ✅ Database operations work
- ✅ Transactions are atomic
- ✅ Automatic features work (loyalty points, wallet creation, etc.)

---

## 🎯 Next Steps

After testing:
1. **Document any bugs** found
2. **Write automated tests** for critical flows
3. **Continue API migration** (38 routes remaining)
4. **Update frontend** to use these APIs
5. **Deploy to staging** for real-world testing

---

**Happy Testing!** 🚀

If you find issues, check the console logs with `pnpm dev`
