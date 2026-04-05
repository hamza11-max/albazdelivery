import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Prisma ORM v7 does not auto-load env vars.
// Load `.env` then `.env.local` (local wins). Use `override: true` so repo files win over a
// machine-level DATABASE_URL (e.g. an old Supabase URL left in Windows user env).
dotenv.config({ override: true })
dotenv.config({ path: '.env.local', override: true })

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL?.trim()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed:
      'cross-env NODE_ENV=development node -r @swc/register prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
    // Hosted Postgres (incl. Prisma Postgres) often cannot CREATE/DROP shadow DBs. Create a
    // second empty database in the dashboard and set SHADOW_DATABASE_URL (must differ from DATABASE_URL).
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
})
