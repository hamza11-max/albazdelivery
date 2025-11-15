# Prisma Studio Connection Fix

## Problem
Prisma Studio is trying to connect to `localhost:5432` instead of your Supabase database.

## Why This Happens
Prisma Studio reads environment variables, but if there's a `.env` file with `localhost`, it might override `.env.local`.

## Solutions

### ✅ Solution 1: Use Supabase Table Editor (Recommended)
Since you can't connect to the database locally, use Supabase's web interface:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor"
4. Browse and edit your data directly

**This is the easiest and most reliable method.**

### Solution 2: Fix Prisma Studio (If Database is Accessible)

I've created a script that loads `.env.local` before starting Prisma Studio:

```bash
npm run db:studio
```

The script (`scripts/start-prisma-studio.js`) will:
- Load `.env.local` file
- Use `DIRECT_URL` if available (for Supabase direct connections)
- Convert pgbouncer URLs to direct connections
- Start Prisma Studio with the correct DATABASE_URL

### Solution 3: Set DATABASE_URL Manually

If the script doesn't work, set it manually:

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres:albaz96hamza@db.lftmnkziovagctibmwff.supabase.co:5432/postgres?sslmode=require"
npm run db:studio
```

**Or use DIRECT_URL:**
```powershell
$env:DATABASE_URL=(Get-Content .env.local | Select-String "DIRECT_URL").Line -replace 'DIRECT_URL=', ''
npm run db:studio
```

## Current Status
- ✅ Script created: `scripts/start-prisma-studio.js`
- ✅ Package.json updated: `npm run db:studio` now uses the script
- ⚠️ If database is not accessible from your network, use Supabase web interface instead

---

**Recommendation**: Use Supabase Table Editor for now - it's more reliable and doesn't require local database access.

