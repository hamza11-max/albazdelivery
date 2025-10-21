# 🚀 Vercel Deployment Guide - AL-baz Delivery

Complete guide to deploy your AL-baz Delivery platform on Vercel.

---

## ✅ **What Was Fixed**

The initial deployment failed because Prisma Client wasn't being generated. I've added:
- ✅ `postinstall` script in `package.json` to auto-generate Prisma Client

---

## 📋 **Pre-Deployment Checklist**

Before deploying, ensure:
- [x] `postinstall` script added to `package.json`
- [x] Code pushed to GitHub
- [ ] Database URL ready (Neon, Supabase, Railway, etc.)
- [ ] Environment variables prepared
- [ ] `.env.example` has no real credentials

---

## 🗄️ **Step 1: Set Up Database**

You need a PostgreSQL database. Choose one:

### **Option A: Neon (Recommended - Free tier)**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project: "albazdelivery"
4. Region: Choose closest to your users
5. Copy **Connection String** (starts with `postgresql://`)
6. Save for later ✅

### **Option B: Supabase**
1. Go to https://supabase.com
2. Create new project
3. Settings → Database → Connection String
4. Copy **URI** (starts with `postgresql://`)
5. Save for later ✅

### **Option C: Railway**
1. Go to https://railway.app
2. New Project → PostgreSQL
3. Copy **DATABASE_URL** from Variables tab
4. Save for later ✅

---

## 🔐 **Step 2: Generate Secrets**

### **Generate NEXTAUTH_SECRET**

**Windows PowerShell:**
```powershell
# Generate random secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Or use online tool:**
- Go to: https://generate-secret.vercel.app/32
- Copy the generated secret
- Save for later ✅

---

## 🌐 **Step 3: Push to GitHub**

If not already done:

```powershell
cd e:\nn\albazdelivery

# Add and commit the package.json fix
git add package.json
git commit -m "fix: Add postinstall script for Prisma Client generation"
git push
```

---

## 🚀 **Step 4: Deploy to Vercel**

### **4.1: Import Project**
1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Click **"Import"** on your `albazdelivery` repository
4. Click **"Import"**

### **4.2: Configure Project**
- **Framework Preset**: Next.js (auto-detected ✅)
- **Root Directory**: `./` (leave default)
- **Build Command**: `pnpm run build` (auto-detected ✅)
- **Output Directory**: `.next` (auto-detected ✅)
- **Install Command**: `pnpm install` (auto-detected ✅)

### **4.3: Add Environment Variables**

Click **"Environment Variables"** and add:

#### **Required Variables:**

| Name | Value | Where to get it |
|------|-------|-----------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | From Step 1 (Neon/Supabase/Railway) |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` | Will be auto-generated, use placeholder first |
| `NEXTAUTH_SECRET` | Your generated secret | From Step 2 |

**Important**: For `NEXTAUTH_URL`, you can:
- Use placeholder: `https://example.com` (update after first deploy)
- Or skip it - Vercel will auto-detect

#### **Optional Variables (Add Later):**
```env
REDIS_URL=redis://...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASSWORD=your-password
```

### **4.4: Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. ✅ Build should succeed now!

---

## 🔄 **Step 5: Post-Deployment Setup**

### **5.1: Update NEXTAUTH_URL**
After successful deployment:
1. Copy your Vercel URL: `https://your-project.vercel.app`
2. Go to: Project Settings → Environment Variables
3. Edit `NEXTAUTH_URL` to your actual URL
4. Redeploy (optional, or wait for next deploy)

### **5.2: Initialize Database**
You need to run migrations. Two options:

**Option A: Using Vercel CLI (Recommended)**
```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production
pnpm prisma db push --schema=./prisma/schema.prisma
```

**Option B: Using Database GUI**
1. Open your database provider (Neon/Supabase)
2. Go to SQL Editor
3. Copy contents of `prisma/schema.prisma`
4. Convert to SQL and run (or use Prisma Studio)

**Option C: Add build script (Automatic)**
Add to `package.json`:
```json
"scripts": {
  "vercel-build": "prisma generate && prisma db push --accept-data-loss && next build"
}
```
This will auto-run migrations on each deploy. ⚠️ **Use with caution in production!**

### **5.3: Seed Database (Optional)**
```powershell
# With Vercel CLI
vercel env pull .env.production
pnpm db:seed
```

---

## ✅ **Step 6: Verify Deployment**

1. **Visit Your Site**
   ```
   https://your-project.vercel.app
   ```

2. **Test Login**
   - Try creating an account
   - Or use seeded accounts (if you ran seed)

3. **Check API Routes**
   ```
   https://your-project.vercel.app/api/health
   ```

4. **Monitor Logs**
   - Vercel Dashboard → Your Project → Logs
   - Check for any errors

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: Build Fails - "Module not found: .prisma/client"**
✅ **FIXED!** This was resolved by adding `postinstall` script.

If still failing:
```json
// package.json
"scripts": {
  "postinstall": "prisma generate",
  "vercel-build": "prisma generate && next build"
}
```

### **Issue 2: Database Connection Error**
**Symptoms**: 500 errors, "Can't reach database server"

**Solution**:
1. Check `DATABASE_URL` in Vercel Environment Variables
2. Ensure database is accessible (not localhost)
3. Check connection string format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```
4. Verify SSL mode is `?sslmode=require` for cloud databases

### **Issue 3: NEXTAUTH_URL Error**
**Symptoms**: Authentication not working, redirect errors

**Solution**:
```env
NEXTAUTH_URL=https://your-actual-project.vercel.app
```
Must match exactly (no trailing slash)

### **Issue 4: Environment Variables Not Working**
**Solution**:
1. Go to: Project Settings → Environment Variables
2. Ensure variables are set for **Production**, **Preview**, and **Development**
3. Redeploy after adding variables

### **Issue 5: Database Schema Not Applied**
**Solution**:
```powershell
# Pull production env vars
vercel env pull .env.production

# Push schema
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### **Issue 6: Build Takes Too Long / Times Out**
**Solution**:
- Remove unused dependencies
- Optimize images
- Check Vercel plan limits (10 min build time on Hobby)

---

## 🔄 **Automatic Deployments**

Once set up, Vercel will automatically deploy when you:
- ✅ Push to `main` branch (Production)
- ✅ Push to any branch (Preview deployment)
- ✅ Create Pull Request (Preview deployment)

### **Manual Deployment**
```powershell
# Using Vercel CLI
vercel --prod
```

---

## 📊 **Vercel Dashboard Features**

### **Deployments**
- View all deployments
- Rollback to previous versions
- Preview URLs for branches

### **Analytics**
- Page views
- Unique visitors
- Top pages
- Real-time data

### **Logs**
- Runtime logs
- Build logs
- Error tracking

### **Domains**
- Add custom domain
- Configure DNS
- SSL certificates (automatic)

---

## 🌍 **Custom Domain Setup**

### **Add Custom Domain**
1. Go to: Project Settings → Domains
2. Click "Add Domain"
3. Enter: `yourdomain.com`
4. Configure DNS:

**For Namecheap/GoDaddy:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For root domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

5. Wait for DNS propagation (up to 48 hours)
6. ✅ SSL certificate auto-generated

---

## ⚡ **Performance Optimization**

### **Enable Edge Functions**
Add to API routes:
```typescript
export const runtime = 'edge';
```

### **Enable Image Optimization**
Already configured in `next.config.js`

### **Enable Caching**
Add cache headers to API routes:
```typescript
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
```

---

## 🔐 **Security Best Practices**

1. **Never commit `.env` file** ✅ (gitignored)
2. **Use environment variables** for all secrets ✅
3. **Enable Vercel Authentication** (Settings → Security)
4. **Set up CORS** if needed
5. **Rate limit API routes** (use Upstash Rate Limit)
6. **Monitor logs** regularly
7. **Update dependencies** regularly

---

## 📱 **Preview Deployments**

Every branch and PR gets a unique URL:
```
https://albazdelivery-git-feature-branch-username.vercel.app
```

**Use for:**
- ✅ Testing features
- ✅ Sharing with team
- ✅ QA before production

---

## 🎯 **Deployment Checklist**

After deployment:
- [ ] Visit site and verify it loads
- [ ] Test authentication (login/register)
- [ ] Test API routes
- [ ] Check database connection
- [ ] Verify environment variables
- [ ] Test order creation
- [ ] Check payment flow
- [ ] Test real-time features
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)
- [ ] Enable analytics
- [ ] Set up monitoring/alerts

---

## 📊 **Monitoring & Maintenance**

### **Set Up Monitoring**
1. **Vercel Analytics**: Automatically enabled
2. **Error Tracking**: Use Sentry or LogRocket
3. **Uptime Monitoring**: Use UptimeRobot or StatusCake

### **Regular Maintenance**
```powershell
# Update dependencies monthly
pnpm update

# Check for security issues
pnpm audit

# Run tests
pnpm test

# Push updates
git push
```

---

## 💰 **Vercel Pricing**

### **Hobby Plan (Free)**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless Functions
- ✅ SSL certificates
- ✅ Preview deployments
- ❌ No team features

### **Pro Plan ($20/month)**
- ✅ Everything in Hobby
- ✅ 1 TB bandwidth
- ✅ Advanced analytics
- ✅ Team collaboration
- ✅ Password protection
- ✅ Priority support

**Recommendation**: Start with Hobby, upgrade when needed

---

## 🆘 **Getting Help**

- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Support**: support@vercel.com (Pro plan)
- **Community**: https://github.com/vercel/vercel/discussions

---

## 🎉 **Success!**

Your AL-baz Delivery platform should now be live! 🚀

**Your deployment URL:**
```
https://your-project.vercel.app
```

**Next steps:**
1. Share with team
2. Set up custom domain
3. Enable monitoring
4. Start testing in production
5. Deploy mobile apps (if any)

---

**Generated**: January 2025
**Platform**: AL-baz Delivery
**Status**: Ready to deploy! 🚀
