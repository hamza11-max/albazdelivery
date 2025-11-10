# Database Setup Guide - AL-baz الباز

## Supabase Database Configuration

For Supabase, you need **two connection strings**:

1. **Direct Connection** (port 5432) - For Prisma migrations
2. **Pooled Connection** (port 6543) - For application queries (optional, can use direct)

### Step 1: Get Your Supabase Connection Strings

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, you'll find:
   - **URI** (Direct connection) - Use for migrations
   - **Connection pooling** - Use for application (optional)

### Step 2: Configure Environment Variables

Create `.env.local` file in the root directory:

```bash
# Direct connection for migrations (REQUIRED)
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Application connection (can use direct or pooled)
# Option A: Direct connection (simpler)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Option B: Pooled connection (better for production)
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:6543/postgres?pgbouncer=true"
```

### Step 3: Run Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Or push schema directly (for development)
npx prisma db push
```

### Step 4: Verify Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

## Troubleshooting

### Error: Can't reach database server
- Verify your Supabase project is active
- Check that the connection string is correct
- Ensure your IP is allowed in Supabase firewall settings

### Error: Migration failed
- Make sure you're using the **direct connection** (port 5432) for `DIRECT_URL`
- Check database credentials
- Verify the database exists in Supabase

### Error: Connection timeout
- Check Supabase project status
- Verify network connectivity
- Try using the direct connection URL instead of pooled

## Security Notes

- Never commit `.env.local` to git
- Use environment variables in production
- Rotate database passwords regularly
- Use connection pooling in production for better performance

