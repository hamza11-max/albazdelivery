# Vercel Runtime Troubleshooting Guide

## ✅ Build Successful, But App Won't Start?

If your build completes successfully but the app doesn't start, follow these steps:

## 🔍 Step 1: Check Environment Variables

Go to your Vercel Dashboard:
1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Verify these **REQUIRED** variables are set:

### Required Variables:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | From your database provider (Neon, Supabase, Railway) |
| `NEXTAUTH_SECRET` | Secret key for session encryption | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's URL | `https://your-project.vercel.app` |

### Generate NEXTAUTH_SECRET:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 🔍 Step 2: Check Runtime Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **Functions** tab
4. Look for any error messages

Common errors:
- `NEXTAUTH_SECRET is missing` → Add the secret to environment variables
- `Invalid DATABASE_URL` → Check your database connection string format
- `Cannot connect to database` → Verify database is accessible and URL is correct

## 🔍 Step 3: Test Database Connection

Your database connection string should look like:
```
postgresql://user:password@host:5432/database?sslmode=require
```

**Important**: 
- Must include `?sslmode=require` for production databases
- No spaces or extra characters
- Password should be URL-encoded if it contains special characters

## 🔍 Step 4: Test Authentication Endpoint

After setting environment variables, test the auth endpoint:

1. Visit: `https://your-project.vercel.app/api/auth/session`
2. Should return: `{"user":null}` (if not logged in) or user data

If you get an error, check:
- `NEXTAUTH_SECRET` is set correctly
- `NEXTAUTH_URL` matches your Vercel URL exactly (no trailing slash)

## 🔍 Step 5: Use Diagnostic Endpoint

Visit: `https://your-project.vercel.app/api/debug/env`

This will show you:
- Which environment variables are set (without exposing values)
- Database connectivity status
- Common configuration issues

**Note**: In production, this endpoint requires admin authentication.

## 🚨 Common Issues & Solutions

### Issue: "500 Internal Server Error"
**Solution**: Check Vercel function logs for specific error message

### Issue: "NEXTAUTH_URL mismatch"
**Solution**: 
- Set `NEXTAUTH_URL` to your exact Vercel URL
- No trailing slash
- Use `https://` not `http://`

### Issue: "Database connection timeout"
**Solution**:
- Verify database is running
- Check firewall rules allow Vercel IPs
- Ensure connection string includes `?sslmode=require`

### Issue: "Missing NEXTAUTH_SECRET"
**Solution**: 
- Generate a new secret using the command above
- Add it to Vercel environment variables
- Redeploy

## 📝 Quick Checklist

- [ ] `DATABASE_URL` is set and valid
- [ ] `NEXTAUTH_SECRET` is set (32+ character random string)
- [ ] `NEXTAUTH_URL` matches your Vercel deployment URL
- [ ] Database is accessible from Vercel's IPs
- [ ] No typos in environment variable names (case-sensitive)
- [ ] Redeployed after adding environment variables

## 🔄 After Fixing Environment Variables

1. **Redeploy**: Go to Vercel Dashboard → Deployments → Click "Redeploy" on latest deployment
2. **Or**: Push a new commit to trigger automatic deployment
3. **Wait**: 2-3 minutes for deployment to complete
4. **Test**: Visit your app URL

## 📞 Still Not Working?

1. Check Vercel function logs for specific error messages
2. Verify all environment variables are set correctly
3. Test database connection separately
4. Check Next.js runtime logs in Vercel dashboard

---

**Last Updated**: January 2025
**Platform**: Vercel
**Framework**: Next.js 15.5.6

