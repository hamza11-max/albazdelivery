import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

export function getVendorLocalDataDir(): string {
  const env = process.env.VENDOR_USER_DATA_PATH
  if (env && String(env).trim().length > 0) return String(env).trim()
  const fallback = path.join(process.cwd(), ".vendor-local-data")
  try {
    fs.mkdirSync(fallback, { recursive: true })
  } catch {
    /* ignore */
  }
  return fallback
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJsonFileAtomic(filePath: string, data: unknown) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  const tmp = `${filePath}.${randomUUID()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8")
  fs.renameSync(tmp, filePath)
}

export function getGuestTablesPath() {
  return path.join(getVendorLocalDataDir(), "guest-tables.json")
}

export function getGuestOrdersPath() {
  return path.join(getVendorLocalDataDir(), "guest-orders.json")
}

/** 86 / hide-from-QR + optional metadata (local to vendor data dir). */
export function getGuestMenuProductStatePath() {
  return path.join(getVendorLocalDataDir(), "guest-menu-product-state.json")
}

export function getAccountingExpensesPath() {
  return path.join(getVendorLocalDataDir(), "accounting-expenses.json")
}

export function getOfflineDbPath() {
  return path.join(getVendorLocalDataDir(), "vendor-offline.db")
}
