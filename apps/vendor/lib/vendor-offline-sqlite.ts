import fs from "fs"
import Database from "better-sqlite3"
import { getOfflineDbPath } from "./restaurant-local-data"

/** better-sqlite3 default export is the constructor; this is the opened DB handle type */
export type VendorOfflineDatabase = InstanceType<typeof Database>

const READONLY_OPTIONS = {
  readonly: true,
  fileMustExist: true,
} as const satisfies NonNullable<ConstructorParameters<typeof Database>[1]>

/**
 * Opens `vendor-offline.db` read-only next to `VENDOR_USER_DATA_PATH`, runs `fn`, then closes.
 * Returns `null` if the file is missing, open fails, or `fn` throws (caller should treat as empty).
 */
export function withReadonlyVendorDatabase<T>(fn: (db: VendorOfflineDatabase) => T): T | null {
  const dbPath = getOfflineDbPath()
  if (!fs.existsSync(dbPath)) return null
  let db: VendorOfflineDatabase | undefined
  try {
    db = new Database(dbPath, READONLY_OPTIONS)
    return fn(db)
  } catch {
    return null
  } finally {
    try {
      db?.close()
    } catch {
      /* ignore */
    }
  }
}
