# Local Database Setup Guide

## Problem
Prisma Studio is trying to connect to `localhost:5432` but your database isn't running locally.

## Solutions

### Option 1: Use Your Production Database (Quickest)

If you already have a production database (from Vercel deployment), you can use it for local development:

1. **Get your production DATABASE_URL** from Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Copy the `DATABASE_URL` value

2. **Create `.env.local` file** in the project root:
   ```bash
   # Database (use your production database)
   DATABASE_URL="postgresql://user:password@your-db-host:5432/database?sslmode=require"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Run Prisma Studio**:
   ```bash
   npm run db:studio
   ```

### Option 2: Set Up Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

2. **Create database**:
   ```sql
   CREATE DATABASE albazdelivery;
   ```

3. **Create `.env.local` file**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/albazdelivery"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Push schema to database**:
   ```bash
   npm run db:push
   ```

5. **Run Prisma Studio**:
   ```bash
   npm run db:studio
   ```

## Creating an Admin User

Once you can access Prisma Studio:

1. Open Prisma Studio: `npm run db:studio`
2. Go to the `User` model
3. Click "Add record"
4. Create a user with:
   - `email`: your email
   - `name`: your name
   - `phone`: your phone number
   - `password`: (you'll need to hash it - see below)
   - `role`: `ADMIN`
   - `status`: `APPROVED`

### Hash Password for Admin User

You can use this script to hash a password:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash))"
```

Or create a user via the registration API and then update the role to ADMIN in Prisma Studio.

## Quick Fix: Update Existing User to Admin

If you already have a user account:

1. Open Prisma Studio
2. Find your user in the `User` table
3. Edit the user
4. Change `role` to `ADMIN`
5. Save

---

**Note**: Make sure your `.env.local` file is in the project root and contains a valid `DATABASE_URL`.

