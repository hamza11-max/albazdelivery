# Database Connection Workaround Guide

## Current Issue

The database connection is failing with error:
```
Error: P1001: Can't reach database server at `db.lftmnkziovagctibmwff.supabase.co:5432`
```

## Most Likely Cause: Supabase Project Paused

Supabase free tier projects automatically pause after 7 days of inactivity. This is the most common cause of connection failures.

## Solution 1: Activate Supabase Project (Recommended)

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Find project: `lftmnkziovagctibmwff`
   - Click on it

3. **Check Project Status**
   - If project shows **"Paused"**, click **"Restore"** button
   - Wait 1-2 minutes for the project to become active

4. **Verify Connection**
   - Go to **Settings** → **Database**
   - Check that the connection string is correct
   - Verify the database is accessible

5. **Test Connection**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/test-db-connection-enhanced.ps1
   ```

6. **Run Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

## Solution 2: Use Database Push (Alternative)

If migrations fail, you can use `db push` which is more lenient:

```bash
# This will push the schema directly to the database
npx prisma db push
```

**Note**: `db push` doesn't create migration history but works for development.

## Solution 3: Check Connection String

### Verify Your Connection String

1. **Go to Supabase Dashboard** → **Settings** → **Database**
2. **Copy the connection string** (URI format)
3. **Update your `.env` file**:

```bash
# Direct connection for migrations (port 5432)
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.lftmnkziovagctibmwff.supabase.co:5432/postgres?sslmode=require"

# Pooled connection for application (port 6543)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.lftmnkziovagctibmwff.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
```

### Important Notes:

- **Direct URL (5432)**: Required for migrations, supports all Prisma features
- **Pooled URL (6543)**: Better for application queries, has some limitations
- **SSL Mode**: Must include `?sslmode=require` for Supabase
- **Password**: Make sure your password is correct (no special characters that need URL encoding)

## Solution 4: Test Network Connectivity

### Test if you can reach the database server:

```powershell
# Test network connection
Test-NetConnection -ComputerName db.lftmnkziovagctibmwff.supabase.co -Port 5432

# Test DNS resolution
Resolve-DnsName -Name db.lftmnkziovagctibmwff.supabase.co
```

### Common Network Issues:

1. **Firewall blocking**: Check if your firewall allows outbound connections on port 5432
2. **VPN interference**: Try disconnecting VPN if connected
3. **Corporate network**: Some corporate networks block database connections
4. **ISP blocking**: Some ISPs block certain ports

## Solution 5: Use Alternative Database (Development)

If Supabase continues to have issues, you can use a local PostgreSQL database for development:

### Setup Local PostgreSQL:

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

2. **Create Database**:
   ```sql
   CREATE DATABASE albazdelivery;
   ```

3. **Update `.env` file**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/albazdelivery"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/albazdelivery"
   ```

4. **Run Migration**:
   ```bash
   npx prisma migrate dev --name init
   ```

## Solution 6: Verify Supabase Project Settings

### Check These Settings:

1. **Database Settings**:
   - Go to **Settings** → **Database**
   - Verify connection pooling is enabled
   - Check if there are any IP restrictions

2. **API Settings**:
   - Go to **Settings** → **API**
   - Verify the project URL is correct
   - Check if there are any rate limits

3. **Project Settings**:
   - Go to **Settings** → **General**
   - Verify project is in the correct region
   - Check if there are any usage limits

## Troubleshooting Steps

### Step 1: Verify Project Status
```bash
# Check if project is active in Supabase dashboard
# If paused, click "Restore"
```

### Step 2: Test Connection Script
```bash
powershell -ExecutionPolicy Bypass -File scripts/test-db-connection-enhanced.ps1
```

### Step 3: Check Environment Variables
```bash
# Verify .env file has correct values
cat .env
# Or on Windows:
type .env
```

### Step 4: Test Prisma Connection
```bash
# Try to generate Prisma Client
npx prisma generate

# Try to push schema
npx prisma db push
```

### Step 5: Check Prisma Studio
```bash
# Open Prisma Studio (will fail if connection is bad)
npx prisma studio
```

## Common Error Messages and Solutions

### Error: "Can't reach database server"
- **Cause**: Project is paused or network issue
- **Solution**: Activate project in Supabase dashboard

### Error: "Connection timeout"
- **Cause**: Firewall or network blocking
- **Solution**: Check firewall settings, try different network

### Error: "Authentication failed"
- **Cause**: Wrong password or username
- **Solution**: Verify credentials in Supabase dashboard

### Error: "SSL connection required"
- **Cause**: Missing `sslmode=require` in connection string
- **Solution**: Add `?sslmode=require` to connection string

### Error: "Database does not exist"
- **Cause**: Wrong database name
- **Solution**: Use `postgres` as database name for Supabase

## Next Steps After Connection Works

Once the database connection is established:

1. **Run Migration**:
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Verify Schema**:
   ```bash
   npx prisma studio
   ```

4. **Seed Database** (optional):
   ```bash
   npx prisma db seed
   ```

## Prevention: Keep Project Active

To prevent Supabase projects from pausing:

1. **Use the project regularly** (at least once per week)
2. **Set up a monitoring service** to ping the database periodically
3. **Upgrade to paid plan** (projects don't pause on paid plans)
4. **Use a different provider** for production (Neon, Railway, etc.)

## Support

If you continue to have issues:

1. **Check Supabase Status**: https://status.supabase.com
2. **Supabase Documentation**: https://supabase.com/docs
3. **Supabase Discord**: https://discord.supabase.com
4. **Create a support ticket** in Supabase dashboard

---

**Last Updated**: [Current Date]
**Status**: ⚠️ Waiting for Supabase project activation

