# Netlify Environment Variables Setup Guide

## ⚠️ CRITICAL: Required Environment Variables

Your deployment is failing because these environment variables are missing. Follow the steps below to fix the 500 error.

## 🔧 How to Set Environment Variables on Netlify

1. Go to your Netlify Dashboard
2. Select your site: **albaz-dz**
3. Navigate to: **Site settings** → **Environment variables**
4. Click **"Add a variable"** for each of the following:

---

## 📋 Required Variables

### 1. NEXTAUTH_URL
**Value:** `https://main--albaz-dz.netlify.app`
(Or your production URL once you remove the `main--` prefix)

**What it does:** Tells NextAuth.js where your app is deployed.

---

### 2. NEXTAUTH_SECRET
**Value:** Generate a random secure string

**How to generate:**
```bash
# On Mac/Linux/Git Bash
openssl rand -base64 32

# Or use this online tool
# https://generate-secret.vercel.app/32
```

**Example:** `jZa8K9xM2nP4vL6wQ8eR3tY5uI7oP1aS2dF4gH6jK8lZ`

**What it does:** Encrypts session tokens and cookies.

---

### 3. DATABASE_URL
**Value:** Your PostgreSQL connection string

**Format:**
```
postgresql://username:password@host:5432/database?sslmode=require
```

**Where to get it:**
- **Neon.tech** (Free): https://neon.tech → Create project → Copy connection string
- **Supabase** (Free): https://supabase.com → Project Settings → Database → Connection string
- **Railway** ($5 credit): https://railway.app → New PostgreSQL → Copy connection string

**Example:**
```
postgresql://user:pass@ep-cool-sunset-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**What it does:** Connects your app to the database for user authentication and data storage.

---

## 🎯 Optional Variables (for Google OAuth)

### 4. GOOGLE_CLIENT_ID
**Value:** Your Google OAuth Client ID

**How to get:**
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URI: `https://main--albaz-dz.netlify.app/api/auth/callback/google`
6. Copy the Client ID

---

### 5. GOOGLE_CLIENT_SECRET
**Value:** Your Google OAuth Client Secret

**Where to find:** Same place as Client ID above

---

## ✅ Verification Checklist

After adding all environment variables:

- [ ] NEXTAUTH_URL is set to your Netlify URL
- [ ] NEXTAUTH_SECRET is a random 32+ character string
- [ ] DATABASE_URL points to a valid PostgreSQL database
- [ ] (Optional) GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- [ ] Clicked **"Save"** in Netlify
- [ ] Triggered a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

---

## 🔄 After Setting Variables

1. **Redeploy your site:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"**
   - Select **"Deploy site"**

2. **Check the logs:**
   - Wait for deployment to complete
   - Go to **Functions** tab
   - Look for `api-auth-session` or similar
   - Click to view logs - should show no errors

3. **Test your site:**
   - Visit `https://main--albaz-dz.netlify.app`
   - The 500 error should be gone
   - You should see the login page

---

## 🗄️ Database Setup (If You Don't Have One)

### Recommended: Neon (Free, Serverless PostgreSQL)

1. **Sign up:** https://neon.tech
2. **Create project:**
   - Project name: `albazdelivery`
   - Region: Choose closest to your users
   - PostgreSQL version: 16 (latest)
3. **Copy connection string:**
   - Go to **Dashboard** → **Connection string**
   - Copy the string (starts with `postgresql://`)
4. **Add to Netlify:**
   - Paste as `DATABASE_URL` in Netlify environment variables

### After Database Setup

Run Prisma migrations to create tables:

```bash
# Locally, with DATABASE_URL set
npx prisma migrate deploy

# Or add this to Netlify build command:
# pnpm run build && npx prisma migrate deploy
```

---

## 🐛 Still Getting Errors?

### Check Netlify Function Logs:
1. Go to **Functions** tab in Netlify dashboard
2. Find the failing function (usually `api-auth-session`)
3. Click to view detailed error logs

### Common Issues:

**Error: "Invalid URL"**
- Solution: Check DATABASE_URL format, ensure it includes `?sslmode=require`

**Error: "NEXTAUTH_URL is required"**
- Solution: Make sure NEXTAUTH_URL is exactly your site URL (no trailing slash)

**Error: "Can't reach database"**
- Solution: Verify database is running and connection string is correct

---

## 📞 Need Help?

If you're still stuck after following this guide:
1. Check the Netlify function logs for specific error messages
2. Verify all environment variables are spelled correctly (case-sensitive)
3. Make sure there are no extra spaces in the values
4. Try regenerating NEXTAUTH_SECRET if auth still fails

---

**Last Updated:** January 2025
**Deployment Platform:** Netlify
**Framework:** Next.js 15.2.4 with App Router
