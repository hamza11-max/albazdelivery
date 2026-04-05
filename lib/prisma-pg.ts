import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

export function createPrismaPgClient(
  connectionString: string,
  options?: {
    log?: ConstructorParameters<typeof PrismaClient>[0]['log']
  },
) {
  // Prisma's adapter types can end up mismatched when multiple `pg/@types/pg`
  // versions are installed. Runtime is unaffected, so we keep this constructor
  // call intentionally loose for TypeScript compatibility.
  const adapter = new PrismaPg({ connectionString } as any)
  const prisma = new PrismaClient({
    adapter,
    ...(options?.log !== undefined ? { log: options.log } : {}),
  })
  return { prisma }
}
