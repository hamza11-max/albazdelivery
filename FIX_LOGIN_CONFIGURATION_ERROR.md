# 🔧 Fix Login Configuration Error

## ❌ Error: `[Login] Failed: Configuration`

This error occurs when NextAuth.js is missing required configuration, specifically the `NEXTAUTH_SECRET` environment variable.

---

## ✅ Quick Fix (2 minutes)

### Step 1: Generate NEXTAUTH_SECRET

Run this command in your project root:

```powershell
node scripts/generate-nextauth-secret.js
```

This will output a secret like:
```
NEXTAUTH_SECRET="QMXrBNQtRWfUtOqC2gGMCIpmftXPF9s/htzTO9IUqs0="
```

### Step 2: Create `.env.local` file

Create a file named `.env.local` in the project root (`e:\nn\albazdelivery\.env.local`):

```bash
# Copy the generated secret here
NEXTAUTH_SECRET="QMXrBNQtRWfUtOqC2gGMCIpmftXPF9s/htzTO9IUqs0="
NEXTAUTH_URL="http://localhost:3000"

# Also add your database URL
DATABASE_URL="your-database-connection-string"
```

### Step 3: Restart the development server

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🔍 What Changed

I've updated the code to:
1. ✅ Provide better error messages when `NEXTAUTH_SECRET` is missing
2. ✅ Use a temporary development secret (with warnings) if not set
3. ✅ Created a script to easily generate secrets
4. ✅ Created `.env.example` template file

---

## 📋 Complete Environment Setup

### Required Variables

```bash
# Authentication (REQUIRED)
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"

# Database (REQUIRED)
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### Optional Variables

```bash
# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
```

---

## 🧪 Verify It's Fixed

1. **Check the console** - You should no longer see the "Configuration" error
2. **Try logging in** - The login should work now
3. **Check server logs** - Should see authentication working

---

## ⚠️ Important Notes

- **Development**: The app will use a temporary secret if `NEXTAUTH_SECRET` is not set (with warnings)
- **Production**: `NEXTAUTH_SECRET` is REQUIRED - authentication will fail without it
- **Security**: Never commit `.env.local` to git (it's already in `.gitignore`)

---

## 🆘 Still Having Issues?

1. **Check if `.env.local` exists** in the project root
2. **Verify the secret is correct** - no extra spaces or quotes
3. **Restart the server** after adding environment variables
4. **Check server console** for any error messages
5. **Verify DATABASE_URL** is also set (required for authentication)

---

**After fixing, login should work!** 🎉

