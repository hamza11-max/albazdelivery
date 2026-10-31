import { normaliseSearchText } from '@albaz/pos-core'
import Database from 'better-sqlite3'

/** Opens the local database with the settings and SQL functions every connection must have. */
export function openDatabase(file: string): Database.Database {
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')
  // Used by the catalog_search triggers (migration 0002).
  db.function('search_text', { deterministic: true, varargs: true }, (...parts: unknown[]) =>
    normaliseSearchText(parts.filter((p) => typeof p === 'string' && p.length > 0).join(' ')),
  )
  return db
}

export function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
}

/** Atomically increments an integer counter stored in kv and returns the new value. */
export function nextCounter(db: Database.Database, key: string): number {
  const row = db
    .prepare(
      `INSERT INTO kv (key, value) VALUES (?, '1')
       ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)
       RETURNING value`,
    )
    .get(key) as { value: string }
  return Number(row.value)
}
