// This file now only contains Prisma database integration
// All mock database code has been removed as it's no longer needed
// after full migration to production-ready infrastructure

// Export Prisma client for database operations
export { prisma } from './prisma'

// Legacy export for backward compatibility
export const db = {
  // This is a placeholder - all database operations should use prisma directly
  // The mock database has been removed
}
