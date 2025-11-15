# Create Admin User Guide

## ⚠️ Important: Database Connection Issue

Your local machine cannot connect to the Supabase database (likely a network/firewall issue). **Prisma Studio will not work locally** in this case.

**Solution**: Use Supabase's web interface instead - it's easier and always works!

## ✅ Solution: Use Supabase Web Interface

### Option 1: Supabase Table Editor (Easiest - Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to "Table Editor"** (left sidebar)
4. **Click on "User" table**
5. **Click "Insert row"** (or edit an existing user)
6. **Fill in the fields**:
   - `email`: `admin@albaz.dz`
   - `name`: `Admin User`
   - `phone`: `0551234567`
   - `password`: (see below for hash)
   - `role`: `ADMIN`
   - `status`: `APPROVED`
7. **Click "Save"**

**To get password hash**, run:
```bash
node scripts/create-admin-user-hash.js Admin123!
```
Then copy the hash and paste it in the `password` field.

### Option 2: Supabase SQL Editor

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)
4. **Click "New query"**
5. **Copy and paste** the contents of `scripts/create-admin-user.sql`
6. **Click "Run"** (or press Ctrl+Enter)

**Note**: The SQL script already has a password hash for `Admin123!` - you can use it as-is.

### Step 3: Verify Admin User

After running the SQL, you should see the admin user in the results:
- Email: `admin@albaz.dz`
- Role: `ADMIN`
- Status: `APPROVED`

### Step 4: Login

1. Go to: `https://albazdelivery.vercel.app/login`
2. Email: `admin@albaz.dz`
3. Password: `Admin123!`

## Alternative: Update Existing User to Admin

If you already have a user account, you can update it to ADMIN:

```sql
UPDATE "User" 
SET role = 'ADMIN', status = 'APPROVED' 
WHERE email = 'your-email@example.com';
```

## Custom Admin User

To create a custom admin user, modify the SQL script:

```sql
INSERT INTO "User" (
  id, email, name, phone, password, role, status, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'your-email@example.com',  -- Change this
  'Your Name',                -- Change this
  '0551234567',               -- Change this
  '$2a$12$...',               -- Run: node scripts/create-admin-user-hash.js YourPassword
  'ADMIN',
  'APPROVED',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN', status = 'APPROVED';
```

---

**Note**: The SQL script uses `ON CONFLICT` so it's safe to run multiple times - it will update an existing user to ADMIN if the email already exists.

