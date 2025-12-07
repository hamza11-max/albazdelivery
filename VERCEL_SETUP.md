# 🚀 Vercel Deployment Guide for AL-baz

Complete guide to deploy AL-baz delivery platform on Vercel with Prisma database.

---

## 📋 Prerequisites

- [ ] Vercel account (https://vercel.com)
- [ ] PostgreSQL database (Neon, Supabase, or Railway)
- [ ] GitHub repository
- [ ] Node.js 22+

---

## 🗄️ Step 1: Set Up Database

### Option A: Neon (Recommended - Free tier)
1. Go to https://neon.tech
2. Create account
3. Create new project: "albaz-delivery"
4. Copy connection string
5. Format: `postgresql://user:password@host/dbname?sslmode=require`

### Option B: Supabase
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (Transaction mode)
5. Replace `[YOUR-PASSWORD]` with your password

### Option C: Railway
1. Go to https://railway.app
2. Create new PostgreSQL database
3. Copy connection string from Variables tab

---

## 🔧 Step 2: Configure Environment Variables

Create `.env` file locally for testing:

```env
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### Generate NEXTAUTH_SECRET
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use online: https://generate-secret.vercel.app/32

---

## 🚀 Step 3: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
```powershell
pnpm add -g vercel
```

2. **Login**
```powershell
vercel login
```

3. **Link Project**
```powershell
vercel link
```

4. **Set Environment Variables**
```powershell
# Set each variable
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Or import from .env file
vercel env pull .env.local
```

5. **Deploy**
```powershell
vercel --prod
```

### Method 2: Vercel Dashboard

1. **Import GitHub Repository**
   - Go to https://vercel.com/new
   - Import your repository
   - Framework preset: Next.js

2. **Configure Build Settings**
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from `.env`
   - Select "Production" environment

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

---

## 🗃️ Step 4: Run Database Migrations

### After First Deployment

```powershell
# Set DATABASE_URL in your terminal
$env:DATABASE_URL="your-production-database-url"

# Run migrations
pnpm prisma migrate deploy

# Seed database with initial data
pnpm db:seed
```

### Automatic Migrations (Recommended)

Add to `package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Then update `vercel.json`:
```json
{
  "buildCommand": "pnpm run vercel-build"
}
```

---

## ✅ Step 5: Verify Deployment

### 1. Check Build Logs
- Vercel Dashboard → Deployments → View logs
- Look for errors

### 2. Test API Endpoints
```powershell
# Health check
curl https://your-app.vercel.app/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 3. Test Authentication
1. Visit: https://your-app.vercel.app/login
2. Try to login with test account
3. Check console for errors

### 4. Check Database Connection
```powershell
# View Prisma Studio (local)
$env:DATABASE_URL="your-production-db"
pnpm db:studio
```

---

## 🔐 Step 6: Upstash Redis Setup (Rate Limiting)

1. **Create Upstash Account**
   - Go to https://upstash.com
   - Create new Redis database
   - Choose region close to your users

2. **Copy Credentials**
   - Copy REST URL
   - Copy REST Token

3. **Add to Vercel**
```powershell
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

4. **Redeploy**
```powershell
vercel --prod
```

---

## 📱 Step 7: Configure Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Settings → Domains
   - Add your domain: `albazdelivery.com`

2. **Update DNS Records**
   - Add A record or CNAME as instructed

3. **Update NEXTAUTH_URL**
```powershell
vercel env add NEXTAUTH_URL production
# Enter: https://albazdelivery.com
```

4. **Force HTTPS**
   - Vercel does this automatically

---

## 🔍 Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue: "Database connection failed"

**Solutions:**
1. Check DATABASE_URL is correct
2. Add `?sslmode=require` to connection string
3. Verify database is accessible from Vercel IPs
4. Check firewall settings

### Issue: "NEXTAUTH_URL not set"

**Solution:**
```powershell
vercel env add NEXTAUTH_URL production
# Enter: https://your-app.vercel.app
```

### Issue: Build fails with Prisma error

**Solution:**
```json
// vercel.json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

### Issue: "Too many requests" 

**Solution:** 
- Verify Upstash Redis is configured
- Check rate limit in `lib/rate-limit.ts`

---

## 📊 Monitoring & Analytics

### 1. Enable Vercel Analytics
```typescript
// app/layout.tsx (already configured)
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 2. Set Up Logging
```powershell
# View logs
vercel logs your-deployment-url
```

### 3. Monitor Performance
- Vercel Dashboard → Analytics
- Check Core Web Vitals
- Monitor API response times

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

1. **Production Branch**: `main` or `master`
   - Automatic production deployment
   - Runs all checks

2. **Preview Branches**: Any other branch
   - Creates preview deployment
   - Unique URL for testing

### Deployment Protection

Enable in Settings → Git:
- [x] Comments on pull requests
- [x] Deployment protection
- [x] Preview deployments

---

## 📝 Environment Variables Checklist

### Required ✅
- [x] `DATABASE_URL` - PostgreSQL connection string
- [x] `NEXTAUTH_URL` - Your domain (https://your-app.vercel.app)
- [x] `NEXTAUTH_SECRET` - Random 32-character string

### Optional (Recommended)
- [ ] `UPSTASH_REDIS_REST_URL` - Rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Rate limiting
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth

### Set for All Environments
Make sure to set variables for:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🚀 Quick Deploy Commands

```powershell
# First time setup
vercel
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Open deployed site
vercel open
```

---

## 📋 Post-Deployment Checklist

- [ ] Database migrations ran successfully
- [ ] Can access login page
- [ ] Can create account
- [ ] Can login with credentials
- [ ] API endpoints responding
- [ ] No errors in Vercel logs
- [ ] Analytics tracking working
- [ ] Rate limiting functional
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

---

## 💰 Costs

### Vercel Pricing
- **Hobby (Free)**:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Good for testing

- **Pro ($20/month)**:
  - 1TB bandwidth/month
  - Team collaboration
  - Advanced analytics
  - Recommended for production

### Database Pricing
- **Neon**: Free tier → $20+/month
- **Supabase**: Free tier → $25+/month
- **Railway**: $5+/month (usage-based)

---

## 🎯 Performance Optimization

### 1. Enable Edge Functions
```typescript
// app/api/*/route.ts
export const runtime = 'edge'
```

### 2. Configure Caching
```typescript
// next.config.mjs
export default {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}
```

### 3. Optimize Images
```typescript
// next.config.mjs
export default {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

---

## 🔐 Security Best Practices

1. **Rotate Secrets Regularly**
   ```powershell
   vercel env rm NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_SECRET production
   ```

2. **Enable DDoS Protection**
   - Already configured via Upstash rate limiting

3. **Secure Headers**
   ```typescript
   // middleware.ts (add these)
   headers.set('X-Frame-Options', 'DENY')
   headers.set('X-Content-Type-Options', 'nosniff')
   ```

4. **Monitor Failed Logins**
   - Check Vercel logs regularly
   - Set up alerts for suspicious activity

---

## 📞 Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Project Docs**: See `README_FIRST.md`

---

## 🎉 Success!

Your AL-baz delivery platform is now live on Vercel! 🚀

**Next Steps:**
1. Share URL with team
2. Test all features
3. Set up monitoring
4. Plan mobile app deployment

---

**Made with ❤️ for Algeria** 🇩🇿
**AL-baz الباز - Soaring High!** 🦅
