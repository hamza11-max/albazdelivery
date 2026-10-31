import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

// Helper: lightweight dev fallback proxy that returns safe defaults for reads
function createDevPrismaFallback() {
  const modelHandler: ProxyHandler<any> = {
    get(_, methodName) {
      const m = String(methodName)
      // Return sensible defaults for common read/write operations
      if (m === 'findMany') return async () => []
      if (m === 'findFirst' || m === 'findUnique') return async () => null
      if (m === 'count') return async () => 0
      if (m === 'aggregate' || m === 'groupBy') return async () => ({})
      if (m === 'create' || m === 'createMany' || m === 'update' || m === 'updateMany' || m === 'delete' || m === 'deleteMany') return async () => null
      if (m === '$transaction') return async (cbOrOps: any) => {
        // If passed a callback, attempt to run it with a model proxy
        if (typeof cbOrOps === 'function') {
          try {
            return await cbOrOps(new Proxy({}, modelHandler))
          } catch (e) {
            return null
          }
        }
        return []
      }
      // Default fallback: return a function that resolves undefined
      return async () => undefined
    },
  }

  const handler: ProxyHandler<any> = {
    get(_, prop) {
      // When accessing a model (e.g. prisma.user), return a model proxy
      if (typeof prop === 'string') {
        return new Proxy({}, modelHandler)
      }
      // Handle $transaction directly on prisma object
      if ((prop as any) === '$transaction') {
        return async (cbOrOps: any) => {
          if (typeof cbOrOps === 'function') {
            try {
              return await cbOrOps(new Proxy({}, modelHandler))
            } catch (e) {
              return null
            }
          }
          return []
        }
      }
      return undefined
    },
  }

  return new Proxy({}, handler)
}

function resolveConnectTimeoutMs(): number {
  const raw = process.env.DATABASE_CONNECT_TIMEOUT_MS
  if (raw && Number.isFinite(Number(raw)) && Number(raw) > 0) {
    return Math.min(60_000, Math.max(1_000, Number(raw)))
  }
  // Fail fast in local/Electron when Supabase/host is unreachable (was ~30s+ with defaults)
  return process.env.NODE_ENV === 'production' ? 15_000 : 5_000
}

// Initialize Prisma Client with proper singleton pattern
let prismaClient: PrismaClient | undefined
let prismaExport: any

// If DATABASE_URL is not provided, export a safe fallback to avoid crashes (dev and packaged app without config)
if (!process.env.DATABASE_URL || String(process.env.DATABASE_URL).trim() === '') {
  // eslint-disable-next-line no-console
  console.warn('[prisma] DATABASE_URL not set — exporting dev fallback Prisma proxy')
  prismaExport = createDevPrismaFallback()
} else {
  const connectionString = String(process.env.DATABASE_URL).trim()
  const connectionTimeoutMillis = resolveConnectTimeoutMs()

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      connectionTimeoutMillis,
      idleTimeoutMillis: 10_000,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool
  }

  prismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter: new PrismaPg(pool as any),
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  }

  // eslint-disable-next-line no-console
  console.info(
    `[prisma] Pool ready (connect timeout ${connectionTimeoutMillis}ms). Offline POS works if DB is unreachable.`
  )

  prismaExport = prismaClient
}

// Use named export only to avoid initialization order issues
export const prisma = prismaExport as unknown as PrismaClient
