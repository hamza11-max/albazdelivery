import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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

  prismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
      // Keep adapter constructor loose to avoid pg type-version mismatch noise.
      adapter: new PrismaPg({ connectionString } as any),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  }

  prismaExport = prismaClient
}

// Use named export only to avoid initialization order issues
export const prisma = prismaExport as unknown as PrismaClient
