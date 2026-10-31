import type Database from 'better-sqlite3'
import { createHash } from 'node:crypto'
import { promises as fs, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export interface Migration {
  version: number
  name: string
  sql: string
  checksum: string
}

export interface MigrationResult {
  from: number
  to: number
  applied: string[]
  /** Copy of the database taken before migrating, when it was not new. */
  backupPath: string | null
}

export class MigrationError extends Error {
  constructor(
    readonly code: 'DB_TOO_NEW' | 'MIGRATION_EDITED' | 'MIGRATION_FAILED' | 'BAD_MIGRATION_FILE',
    message: string,
  ) {
    super(message)
    this.name = 'MigrationError'
  }
}

const FILE_RE = /^(\d{4})_([a-z0-9_]+)\.sql$/

/** Reads `NNNN_name.sql` files, in version order. Versions must be 1, 2, 3, … with no gaps. */
export function loadMigrations(dir: string): Migration[] {
  const migrations = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((file) => {
      const match = FILE_RE.exec(file)
      if (!match) throw new MigrationError('BAD_MIGRATION_FILE', `Migration file name must be NNNN_name.sql: ${file}`)
      const sql = readFileSync(path.join(dir, file), 'utf8')
      return {
        version: Number(match[1]),
        name: match[2]!,
        sql,
        // Line endings normalised so a git checkout with CRLF does not look "edited".
        checksum: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex'),
      }
    })
    .sort((a, b) => a.version - b.version)
  migrations.forEach((m, i) => {
    if (m.version !== i + 1) throw new MigrationError('BAD_MIGRATION_FILE', `Expected migration ${i + 1}, found ${m.version}_${m.name}`)
  })
  return migrations
}

interface AppliedRow {
  version: number
  name: string
  checksum: string
  applied_at: string
}

export function appliedMigrations(db: Database.Database): AppliedRow[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    checksum   TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )`)
  return db.prepare('SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version').all() as AppliedRow[]
}

/**
 * Brings the database up to the latest migration.
 * - Refuses to open a database written by a newer app version.
 * - Refuses to run if an already-applied migration file was changed.
 * - Backs up an existing database before changing it.
 * - Applies each migration in its own transaction; a failure rolls that one back
 *   and stops, leaving the database at the last good version.
 */
export async function migrate(
  db: Database.Database,
  migrations: readonly Migration[],
  opts: { backupDir: string; now?: () => Date },
): Promise<MigrationResult> {
  const now = opts.now ?? (() => new Date())
  const applied = appliedMigrations(db)
  const current = applied.at(-1)?.version ?? 0
  const latest = migrations.at(-1)?.version ?? 0

  if (current > latest) {
    throw new MigrationError('DB_TOO_NEW', `Database is at version ${current}, this app only knows up to ${latest}. Update the app.`)
  }
  for (const row of applied) {
    const known = migrations[row.version - 1]
    if (!known || known.checksum !== row.checksum) {
      throw new MigrationError('MIGRATION_EDITED', `Applied migration ${row.version}_${row.name} was changed after it ran. Add a new migration instead.`)
    }
  }

  const pending = migrations.filter((m) => m.version > current)
  let backupPath: string | null = null
  if (pending.length > 0 && current > 0) {
    await fs.mkdir(opts.backupDir, { recursive: true })
    const stamp = now().toISOString().replace(/[:.]/g, '-')
    backupPath = path.join(opts.backupDir, `pos-v${current}-${stamp}.db`)
    await db.backup(backupPath)
  }

  const insert = db.prepare('INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)')
  for (const m of pending) {
    try {
      db.transaction(() => {
        db.exec(m.sql)
        insert.run(m.version, m.name, m.checksum, now().toISOString())
      })()
    } catch (err) {
      throw new MigrationError('MIGRATION_FAILED', `Migration ${m.version}_${m.name} failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { from: current, to: latest, applied: pending.map((m) => `${m.version}_${m.name}`), backupPath }
}
