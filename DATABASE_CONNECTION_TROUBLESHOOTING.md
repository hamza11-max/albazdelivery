# Database Connection Troubleshooting Guide

## Issue: Can't reach database server

If you're getting this error:
```
Error: P1001: Can't reach database server at `db.xxx.supabase.co:5432`
```

## Step 1: Check Supabase Project Status

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `lftmnkziovagctibmwff`
3. **Check project status**:
   - If project shows **"Paused"** → Click **"Restore"** to activate it
   - Free tier projects auto-pause after 7 days of inactivity
   - It may take 1-2 minutes to restore

## Step 2: Verify Connection String

Your connection string should be in this format:
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

**Current configuration:**
- Host: `db.lftmnkziovagctibmwff.supabase.co`
- Port: `5432` (direct) or `6543` (pooled)
- Database: `postgres`
- SSL: Required (`sslmode=require`)

## Step 3: Test Connection

Run the test script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-db-connection.ps1
```

Or test manually:
```powershell
# Test network connectivity
Test-NetConnection -ComputerName db.lftmnkziovagctibmwff.supabase.co -Port 5432
```

## Step 4: Check Supabase Database Settings

1. Go to **Settings** → **Database** in Supabase dashboard
2. Verify:
   - **Connection string** matches your `.env` file
   - **Connection pooling** is enabled (for port 6543)
   - **SSL mode** is set to require

## Step 5: Check Firewall/IP Restrictions

1. Go to **Settings** → **Database** → **Connection Pooling**
2. Check if there are any IP restrictions
3. For development, you may need to allow your current IP

## Step 6: Get Fresh Connection String

1. Go to **Settings** → **Database** in Supabase
2. Under **Connection string**, select **"URI"**
3. Copy the connection string
4. Update your `.env` and `.env.local` files

## Alternative: Use Connection Pooling for Migrations

If direct connection (port 5432) doesn't work, you can temporarily use the pooled connection:

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Remove directUrl temporarily
  // directUrl = env("DIRECT_URL")
}
```

Then update `.env`:
```bash
DATABASE_URL="postgresql://postgres:albaz96hamza@db.lftmnkziovagctibmwff.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
```

**Note**: Pooled connections have limitations for migrations, but work for `prisma db push`.

## Quick Fix: Use `db push` Instead of Migrate

If migrations fail, you can use `db push` which is more lenient:

```bash
npx prisma db push
```

This will:
- Push schema changes directly to database
- Skip migration history
- Useful for development/prototyping

## Still Having Issues?

1. **Verify Supabase project is active** (most common issue)
2. **Check your internet connection**
3. **Try from a different network** (firewall might be blocking)
4. **Contact Supabase support** if project is active but still can't connect

## Next Steps After Connection Works

Once connection is established:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Or push schema (if migrate fails)
npx prisma db push

# Open Prisma Studio to verify
npx prisma studio
```

