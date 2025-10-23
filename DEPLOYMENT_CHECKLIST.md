# ✅ Deployment Checklist - Vercel + Supabase

Use this checklist as you deploy your AL-baz platform to production.

---

## 📦 Pre-Deployment

- [ ] All code committed to GitHub
- [ ] `.env.local` configured locally and tested
- [ ] Application running locally without errors
- [ ] Database schema finalized in `prisma/schema.prisma`
- [ ] Test accounts created in local database

---

## 🗄️ Supabase Setup

### Create Project
- [ ] Sign up/login to [supabase.com](https://supabase.com)
- [ ] Create new organization (if needed)
- [ ] Create new project
  - [ ] Project name: `albaz-delivery`
  - [ ] Database password: **SAVED SECURELY** ⚠️
  - [ ] Region: Frankfurt or Paris (closest to Algeria)
- [ ] Wait for project provisioning (2-3 min)

### Get Connection String
- [ ] Navigate to Settings → Database
- [ ] Copy **Connection Pooling** URI (port 6543)
- [ ] Replace `[YOUR-PASSWORD]` with actual password
- [ ] Format: `postgresql://postgres.xxxxx:PASSWORD@pooler.supabase.com:6543/postgres`

### Test Connection
- [ ] Add `DATABASE_URL` to `.env.local`
- [ ] Run `pnpm db:push` successfully
- [ ] Verify tables in Supabase → Table Editor
- [ ] Run `pnpm db:seed` (optional)
- [ ] Check data appears in Supabase

---

## 🔐 Environment Variables

### Generate Secrets
- [ ] Generate `NEXTAUTH_SECRET`:
  ```powershell
  # Windows PowerShell
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  [Convert]::ToBase64String($bytes)
  ```
- [ ] **SAVE THIS SECRET** ⚠️

### Prepare Variables List
Copy these - you'll need them for Vercel:

```bash
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@pooler.supabase.com:6543/postgres
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

Optional (if configured):
```bash
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

---

## 📤 GitHub Setup

- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Production ready"`
- [ ] Create GitHub repository
- [ ] Add remote: `git remote add origin https://github.com/USERNAME/albazdelivery.git`
- [ ] Push: `git push -u origin main`

---

## 🚀 Vercel Deployment

### Import Project
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign in with GitHub
- [ ] Click "Add New" → "Project"
- [ ] Import `albazdelivery` repository
- [ ] Verify settings:
  - [ ] Framework: Next.js ✓
  - [ ] Root Directory: `./` ✓
  - [ ] Build Command: `next build` ✓

### Add Environment Variables
In Vercel, add each variable:

Required:
- [ ] `DATABASE_URL` = `postgresql://postgres.xxxxx...` (from Supabase)
- [ ] `NEXTAUTH_SECRET` = `your-generated-secret`
- [ ] `NEXTAUTH_URL` = `https://your-app.vercel.app` (temp, will update)

Optional:
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Note your Vercel URL (e.g., `albazdelivery.vercel.app`)

### Update NEXTAUTH_URL
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Update `NEXTAUTH_URL` with actual Vercel URL
- [ ] Save changes
- [ ] Redeploy: Deployments → Latest → Menu → "Redeploy"

---

## 🧪 Post-Deployment Testing

### Test Authentication
- [ ] Visit `https://your-app.vercel.app/login`
- [ ] Try login with: `admin@albazdelivery.com` / `Admin123!`
- [ ] Verify successful login and redirect
- [ ] Check browser console for errors

### Test API Endpoints
Open browser console on your site:
```javascript
// Test orders API
fetch('/api/orders', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

// Test wallet API
fetch('/api/wallet/balance', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

- [ ] Orders API returns data (or empty array)
- [ ] Wallet API returns balance
- [ ] No 401/403 errors
- [ ] No CORS errors

### Test Database
- [ ] Go to Supabase → Table Editor
- [ ] Verify tables exist
- [ ] Check if login created session data
- [ ] Monitor Connection Pooling usage

### Test Features
- [ ] User registration works
- [ ] Login/logout works
- [ ] Create an order
- [ ] Check notifications
- [ ] Test wallet display
- [ ] Test loyalty points
- [ ] Admin panel loads (if admin user)

---

## 📊 Monitoring Setup

### Vercel
- [ ] Check Vercel → Analytics (if available)
- [ ] Review Vercel → Logs for any errors
- [ ] Set up alerts (optional)

### Supabase
- [ ] Check Database → Reports
- [ ] Monitor table sizes
- [ ] Check connection usage
- [ ] Verify no connection leaks

---

## 🔧 Optional Enhancements

### Custom Domain
- [ ] Vercel → Settings → Domains
- [ ] Add your domain
- [ ] Configure DNS records
- [ ] Update `NEXTAUTH_URL` with custom domain
- [ ] Redeploy

### Rate Limiting (Recommended)
- [ ] Sign up for Upstash (free tier)
- [ ] Create Redis database
- [ ] Copy REST URL and Token
- [ ] Add to Vercel environment variables
- [ ] Redeploy

### Error Tracking
- [ ] Install Sentry: `pnpm add @sentry/nextjs`
- [ ] Run setup: `npx @sentry/wizard@latest -i nextjs`
- [ ] Add DSN to environment variables
- [ ] Redeploy

---

## 🚨 Troubleshooting

### Deployment Failed
- [ ] Check Vercel build logs
- [ ] Verify `postinstall` script in package.json
- [ ] Ensure all environment variables are set
- [ ] Check for TypeScript errors

### Database Connection Issues
- [ ] Verify Supabase project is not paused
- [ ] Check connection string has correct port (6543)
- [ ] Ensure password is correct (no special characters issues)
- [ ] Test connection locally first

### Authentication Not Working
- [ ] Verify `NEXTAUTH_SECRET` is set
- [ ] Check `NEXTAUTH_URL` matches actual URL
- [ ] Clear browser cookies and try again
- [ ] Check Vercel logs for auth errors

### API Returns 500 Errors
- [ ] Check Vercel → Logs for error details
- [ ] Verify Prisma client is generated (`postinstall`)
- [ ] Check database connection is working
- [ ] Review API route code for issues

---

## ✅ Final Checklist

- [ ] ✅ Supabase database is running
- [ ] ✅ Vercel deployment is live
- [ ] ✅ Environment variables configured
- [ ] ✅ Authentication is working
- [ ] ✅ All major features tested
- [ ] ✅ No critical errors in logs
- [ ] ✅ Database connections are stable
- [ ] ✅ Application is accessible globally

---

## 🎉 You're Live!

Congratulations! Your AL-baz delivery platform is now live on:

- **🌐 URL**: https://your-app.vercel.app
- **🗄️ Database**: Supabase (PostgreSQL)
- **⚡ Hosting**: Vercel (Edge Network)

### Next Steps:
1. Share with beta users
2. Monitor for issues
3. Collect feedback
4. Iterate and improve
5. Scale as you grow!

---

## 📞 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Deployment Guide**: `VERCEL_SUPABASE_DEPLOYMENT.md`
- **Integration Guide**: `FRONTEND_INTEGRATION_GUIDE.md`

---

**🇩🇿 Made with ❤️ for Algeria**  
**🦅 AL-baz الباز - Now in Production!**

---

*Save this checklist and check off items as you complete them!*
