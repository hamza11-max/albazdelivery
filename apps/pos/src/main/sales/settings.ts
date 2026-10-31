import type Database from 'better-sqlite3'

import type { SalesSettings } from '../../shared/ipc'
import { getSetting, setSetting } from '../db/database'

/** Defaults from the spec (§3 shop setup): 10 % cashier discount cap, negative stock allowed. */
export const DEFAULT_SALES_SETTINGS: SalesSettings = {
  cashierDiscountCapPercent: 10,
  allowNegativeStock: true,
  receipt: { printer: '', paper: 80, route: 'raster', lang: 'mixed', autoPrint: true, openDrawer: true },
}

export function salesSettings(db: Database.Database): SalesSettings {
  const raw = getSetting(db, 'sales.settings')
  if (!raw) return DEFAULT_SALES_SETTINGS
  try {
    const stored = JSON.parse(raw) as Partial<SalesSettings>
    return { ...DEFAULT_SALES_SETTINGS, ...stored, receipt: { ...DEFAULT_SALES_SETTINGS.receipt, ...stored.receipt } }
  } catch {
    return DEFAULT_SALES_SETTINGS
  }
}

export function saveSalesSettings(db: Database.Database, settings: SalesSettings): SalesSettings {
  setSetting(db, 'sales.settings', JSON.stringify(settings))
  return salesSettings(db)
}
