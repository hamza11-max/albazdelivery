# 🚀 Vercel + Supabase Deployment Guide

**Platform**: Vercel (Hosting) + Supabase (Database)  
**Status**: Production-Ready ✅  
**Date**: January 2025

---

## 📋 Overview

This guide walks you through deploying your AL-baz delivery platform to **Vercel** with **Supabase PostgreSQL** as your production database.

### Why This Stack?
- ✅ **Vercel**: Free tier, automatic deployments, edge functions
- ✅ **Supabase**: Free PostgreSQL, 500MB storage, real-time capabilities
- ✅ **Perfect Match**: Both scale automatically as you grow

---

## 🎯 Deployment Steps

### Phase 1: Supabase Database Setup (15 minutes)

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign in with GitHub
4. Create a new organization (or use existing)
5. Click **"New Project"**

**Project Settings**:
```
Name: albaz-delivery (or your choice)
Database Password: [Generate Strong Password - SAVE THIS!]
Region: Choose closest to Algeria (e.g., Frankfurt, Paris)
Pricing Plan: Free (perfect for starting)
```

6. Click **"Create new project"**
7. Wait 2-3 minutes for provisioning

#### Step 2: Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Choose **"URI"** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

**Important**: Use the **connection pooling** URL (port 6543) for better performance with serverless functions.

#### Step 3: Test Database Connection Locally

1. Update your `.env.local`:
   ```bash
   # Supabase Production Database
   DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
   ```

2. Test the connection:
   ```bash
   # Push schema to Supabase
   pnpm db:push
   ```

3. Verify in Supabase dashboard:
   - Go to **Table Editor**
   - You should see all your tables (User, Order, Store, etc.)

4. Seed the database (optional):
   ```bash
   pnpm db:seed
   ```

---

### Phase 2: Prepare for Vercel (5 minutes)

#### Step 1: Update Middleware for Vercel

Your middleware already uses the lightweight edge config which is perfect for Vercel!

Verify `middleware.ts` has:
```typescript
export const config = {
  matcher: [
    '/driver/:path*',
    '/vendor/:path*',
    '/admin/:path*',
  ],
}
```

✅ This is already configured correctly!

#### Step 2: Verify Environment Variables

Create `.env.production` (for reference, don't commit):
```bash
# Database
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"

# Optional: Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Optional: OAuth (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Step 3: Generate NEXTAUTH_SECRET

```bash
# On Windows PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Or use online tool: https://generate-secret.vercel.app/32
```

Save this secret - you'll need it for Vercel!

---

### Phase 3: Deploy to Vercel (10 minutes)

#### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/albazdelivery.git
git branch -M main
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your `albazdelivery` repository
5. Configure project:

**Framework Preset**: Next.js (auto-detected)  
**Root Directory**: `./` (leave as is)  
**Build Command**: `next build` (auto-detected)  
**Output Directory**: `.next` (auto-detected)

#### Step 3: Add Environment Variables

In Vercel project settings, add these environment variables:

Click **"Environment Variables"** and add:

```bash
# Required Variables
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

NEXTAUTH_SECRET=your-generated-secret-from-step-2

NEXTAUTH_URL=https://your-app.vercel.app
# (Vercel will give you this URL, update after first deploy)

# Optional: Rate Limiting
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

**Important**: Set environment variables for:
- ✅ Production
- ✅ Preview (optional)
- ✅ Development (optional)

#### Step 4: Deploy!

Click **"Deploy"**

Vercel will:
1. Clone your repository
2. Install dependencies
3. Run `prisma generate`
4. Build Next.js app
5. Deploy to edge network

⏱️ First deployment takes 2-3 minutes.

#### Step 5: Update NEXTAUTH_URL

After deployment:
1. Copy your Vercel URL (e.g., `https://albazdelivery.vercel.app`)
2. Go to Vercel project → **Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` with your actual URL
4. Redeploy (Vercel → Deployments → Click menu → "Redeploy")

---

### Phase 4: Database Migration (5 minutes)

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migration
vercel env pull .env.production
pnpm db:push
```

#### Option B: Via Supabase Dashboard

1. Go to Supabase → **SQL Editor**
2. Create new query
3. Paste your schema (from `prisma/schema.prisma`)
4. Or use the Prisma migration SQL:
   ```bash
   # Generate SQL
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > migration.sql
   ```
5. Run the SQL in Supabase

#### Step 2: Seed Production Database (Optional)

**Warning**: Only do this for initial setup, not on live production!

```bash
# Set production database
export DATABASE_URL="your-supabase-url"

# Run seed
pnpm db:seed
```

Or create seed data manually in Supabase **Table Editor**.

---

## ✅ Post-Deployment Checklist

### 1. Test Authentication

```bash
# Visit your deployed site
https://your-app.vercel.app/login

# Try logging in with:
admin@albazdelivery.com / Admin123!
```

### 2. Test API Endpoints

```bash
# Test in browser console
fetch('https://your-app.vercel.app/api/orders', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

### 3. Check Database Connection

1. Go to Supabase → **Table Editor**
2. Check if data is being created
3. Monitor **Database** → **Connection Pooling** for usage

### 4. Monitor Logs

Vercel Dashboard → Your Project → **Logs**
- Check for errors
- Monitor API response times
- Watch for authentication issues

### 5. Test All Features

- [ ] User registration
- [ ] Login/logout
- [ ] Create order
- [ ] Wallet operations
- [ ] Notifications
- [ ] Driver actions
- [ ] Admin panel

---

## 🔧 Configuration Tips

### 1. Optimize Database Connection

In `lib/prisma.ts`, ensure you have:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

This prevents too many database connections in development.

### 2. Enable Connection Pooling

Supabase provides **Supavisor** connection pooling:
- Use port `6543` (pooler) instead of `5432` (direct)
- Already included in the connection string!

### 3. Set Up Upstash Redis (Optional but Recommended)

For rate limiting to work in production:

1. Go to [upstash.com](https://upstash.com)
2. Create account
3. Create Redis database (free tier)
4. Copy **REST URL** and **REST Token**
5. Add to Vercel environment variables

### 4. Configure Custom Domain (Optional)

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `albaz.delivery`)
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS only (Vercel does this automatically)
- [ ] Review Supabase security rules
- [ ] Enable rate limiting (Upstash)
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CORS if needed
- [ ] Review API route permissions

### Supabase Security

1. Go to Supabase → **Settings** → **API**
2. Note your **anon** and **service_role** keys (don't share!)
3. Go to **Authentication** → **Policies**
4. Enable RLS (Row Level Security) if needed

**Note**: Since you're using Prisma with NextAuth, RLS is optional. Your API handles authorization.

---

## 📊 Monitoring & Analytics

### 1. Vercel Analytics (Built-in)

Enable in Vercel Dashboard:
- Go to **Analytics** tab
- Free tier includes Web Vitals

### 2. Supabase Monitoring

Dashboard → **Reports**:
- Database size
- API requests
- Active connections

### 3. Error Tracking (Recommended)

```bash
# Install Sentry
pnpm add @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

---

## 🚨 Troubleshooting

### Issue: "Prisma Client could not locate the Query Engine"

**Solution**:
```bash
# Add to package.json scripts
"postinstall": "prisma generate"
```

Vercel runs this automatically, but verify it's there.

### Issue: "Database connection timeout"

**Solution**:
1. Check Supabase is not paused (free tier pauses after 7 days inactivity)
2. Verify `DATABASE_URL` has port `6543` (pooler)
3. Check Supabase → Database → Connection Pooling is enabled

### Issue: "NextAuth configuration error"

**Solution**:
1. Verify `NEXTAUTH_SECRET` is set in Vercel
2. Verify `NEXTAUTH_URL` matches your Vercel URL exactly
3. Ensure URL includes `https://` and no trailing slash

### Issue: "API routes return 401 Unauthorized"

**Solution**:
1. Clear browser cookies
2. Check middleware.ts is not blocking routes
3. Verify session is being created (check Network tab)

### Issue: "Too many database connections"

**Solution**:
1. Use connection pooling URL (port 6543)
2. Implement connection limit in Prisma config
3. Consider upgrading Supabase plan

### Issue: "Environment variables not updating"

**Solution**:
1. After changing env vars in Vercel, you must **redeploy**
2. Vercel → Deployments → Latest → Menu → "Redeploy"

---

## 💰 Cost Estimation

### Free Tier Limits

**Vercel Free**:
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ⚠️ Limited function execution time

**Supabase Free**:
- ✅ 500MB database storage
- ✅ 2GB file storage
- ✅ 50,000 monthly active users
- ✅ 500MB egress
- ⚠️ Database pauses after 7 days inactivity

### When to Upgrade?

**Vercel Pro ($20/month)**:
- More bandwidth
- Longer function execution
- Team collaboration
- Advanced analytics

**Supabase Pro ($25/month)**:
- 8GB database storage
- No auto-pause
- Daily backups
- Better support

---

## 🎯 Performance Optimization

### 1. Enable Vercel Edge Caching

```typescript
// In your API routes
export const runtime = 'edge' // For edge functions
export const revalidate = 60 // Cache for 60 seconds
```

**Note**: Your middleware already uses edge runtime!

### 2. Optimize Database Queries

```typescript
// Use select to fetch only needed fields
const orders = await prisma.order.findMany({
  select: {
    id: true,
    status: true,
    total: true,
    // Only fields you need
  },
})
```

### 3. Add Database Indexes

Your schema already has indexes! But verify critical queries:
```sql
-- In Supabase SQL Editor
EXPLAIN ANALYZE 
SELECT * FROM "Order" WHERE "customerId" = 'xxx';
```

### 4. Enable Response Compression

Vercel does this automatically! ✅

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# ✨ Vercel automatically deploys!
```

### Preview Deployments

Every branch/PR gets a preview URL:
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
# Vercel creates preview at: albazdelivery-git-feature-new-feature-username.vercel.app
```

### Production Deployment

Only `main` branch deploys to production:
```bash
git checkout main
git merge feature/new-feature
git push origin main
# Deploys to: albazdelivery.vercel.app
```

---

## 📋 Post-Launch Checklist

### Day 1
- [ ] Monitor error logs
- [ ] Test all user flows
- [ ] Check database connections
- [ ] Verify email notifications (if implemented)

### Week 1
- [ ] Review Vercel analytics
- [ ] Check Supabase database size
- [ ] Monitor API response times
- [ ] Gather user feedback

### Month 1
- [ ] Review costs
- [ ] Optimize slow queries
- [ ] Consider CDN for assets
- [ ] Plan scaling strategy

---

## 🎉 Success Checklist

Before announcing launch:

- [ ] ✅ Database deployed to Supabase
- [ ] ✅ App deployed to Vercel
- [ ] ✅ Environment variables configured
- [ ] ✅ Authentication working
- [ ] ✅ All API endpoints tested
- [ ] ✅ Custom domain configured (optional)
- [ ] ✅ SSL certificate active (automatic)
- [ ] ✅ Monitoring set up
- [ ] ✅ Backup strategy in place
- [ ] ✅ Error tracking enabled

---

## 📞 Quick Reference

### Supabase Dashboard
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

### Vercel Dashboard
```
https://vercel.com/YOUR_USERNAME/albazdelivery
```

### Connection Strings
```bash
# Development (local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/albazdelivery"

# Production (Supabase with pooling)
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@pooler.supabase.com:6543/postgres"

# Direct connection (if needed)
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@db.supabase.com:5432/postgres"
```

### Essential Commands
```bash
# Deploy to Vercel
vercel --prod

# Push database schema
pnpm db:push

# Generate Prisma client
pnpm db:generate

# View logs
vercel logs
```

---

## 🚀 You're Ready to Launch!

Your AL-baz delivery platform is now deployed on:
- **Frontend/Backend**: Vercel (Global CDN)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js (Secure)
- **Edge Functions**: Middleware (Fast)

**Next Steps**:
1. Test everything thoroughly
2. Invite beta users
3. Monitor for issues
4. Iterate based on feedback
5. Scale as you grow! 🎉

---

**🇩🇿 Made with ❤️ for Algeria**  
**🦅 AL-baz الباز - Now Live!**

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

**Questions?** Check the troubleshooting section or Vercel's excellent support!
