// Run with Electron's Node (npm run test:db): better-sqlite3 is built for Electron.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { openDatabase } from './database'
import { appliedMigrations, loadMigrations, migrate, MigrationError, type Migration } from './migrate'

const REAL_MIGRATIONS = path.join(__dirname, '..', '..', '..', 'migrations')

function tempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'albaz-pos-test-'))
}

function migrationsDir(files: Record<string, string>): string {
  const dir = tempDir()
  for (const [name, sql] of Object.entries(files)) writeFileSync(path.join(dir, name), sql)
  return dir
}

const code = (c: string) => (err: unknown) => err instanceof MigrationError && err.code === c

test('fresh database migrates to the latest version without a backup', async () => {
  const dir = tempDir()
  const db = openDatabase(path.join(dir, 'pos.db'))
  const migrations = loadMigrations(REAL_MIGRATIONS)
  const result = await migrate(db, migrations, { backupDir: path.join(dir, 'backups') })
  assert.equal(result.from, 0)
  assert.equal(result.to, migrations.length)
  assert.equal(result.backupPath, null)
  assert.equal(appliedMigrations(db).length, migrations.length)
  db.close()
})

test('running again is a no-op', async () => {
  const dir = tempDir()
  const db = openDatabase(path.join(dir, 'pos.db'))
  const migrations = loadMigrations(REAL_MIGRATIONS)
  await migrate(db, migrations, { backupDir: path.join(dir, 'backups') })
  const again = await migrate(db, migrations, { backupDir: path.join(dir, 'backups') })
  assert.deepEqual(again.applied, [])
  assert.equal(again.backupPath, null)
  db.close()
})

test('upgrading an existing database backs it up first', async () => {
  const dir = tempDir()
  const db = openDatabase(path.join(dir, 'pos.db'))
  const v1 = loadMigrations(migrationsDir({ '0001_a.sql': 'CREATE TABLE a (x INTEGER);' }))
  await migrate(db, v1, { backupDir: path.join(dir, 'backups') })
  db.prepare('INSERT INTO a (x) VALUES (42)').run()

  const v2 = loadMigrations(migrationsDir({ '0001_a.sql': 'CREATE TABLE a (x INTEGER);', '0002_b.sql': 'CREATE TABLE b (y INTEGER);' }))
  const result = await migrate(db, v2, { backupDir: path.join(dir, 'backups') })
  assert.deepEqual(result.applied, ['2_b'])
  assert.ok(result.backupPath && existsSync(result.backupPath), 'backup file exists')

  const backup = openDatabase(result.backupPath!)
  assert.equal((backup.prepare('SELECT x FROM a').get() as { x: number }).x, 42)
  assert.equal(appliedMigrations(backup).length, 1, 'backup is the pre-upgrade database')
  backup.close()
  db.close()
})

test('a failing migration rolls back and leaves the previous version', async () => {
  const dir = tempDir()
  const db = openDatabase(path.join(dir, 'pos.db'))
  const files = {
    '0001_a.sql': 'CREATE TABLE a (x INTEGER);',
    '0002_bad.sql': 'CREATE TABLE half_done (y INTEGER); INSERT INTO missing_table VALUES (1);',
  }
  await assert.rejects(migrate(db, loadMigrations(migrationsDir(files)), { backupDir: path.join(dir, 'backups') }), code('MIGRATION_FAILED'))
  assert.equal(appliedMigrations(db).at(-1)?.version, 1)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'half_done'").all()
  assert.deepEqual(tables, [], 'partial migration rolled back')
  db.close()
})

test('refuses a database from a newer app version', async () => {
  const dir = tempDir()
  const db = openDatabase(path.join(dir, 'pos.db'))
  const v2 = loadMigrations(migrationsDir({ '0001_a.sql': 'SELECT 1;', '0002_b.sql': 'SELECT 2;' }))
  await migrate(db, v2, { backupDir: dir })
  await assert.rejects(migrate(db, v2.slice(0, 1), { backupDir: dir }), code('DB_TOO_NEW'))
  db.close()
})

test('refuses to run if an applied migration was edited', async () => {
  const dir = tempDir()
  const db = openDatabase(path.join(dir, 'pos.db'))
  const original: Migration[] = loadMigrations(migrationsDir({ '0001_a.sql': 'CREATE TABLE a (x INTEGER);' }))
  await migrate(db, original, { backupDir: dir })
  const edited = loadMigrations(migrationsDir({ '0001_a.sql': 'CREATE TABLE a (x INTEGER, y INTEGER);' }))
  await assert.rejects(migrate(db, edited, { backupDir: dir }), code('MIGRATION_EDITED'))
  db.close()
})

test('CRLF line endings do not count as an edit', () => {
  const lf = loadMigrations(migrationsDir({ '0001_a.sql': 'SELECT 1;\nSELECT 2;\n' }))
  const crlf = loadMigrations(migrationsDir({ '0001_a.sql': 'SELECT 1;\r\nSELECT 2;\r\n' }))
  assert.equal(lf[0]!.checksum, crlf[0]!.checksum)
})

test('migration files must be numbered 1, 2, 3 with valid names', () => {
  assert.throws(() => loadMigrations(migrationsDir({ '0001_a.sql': '', '0003_c.sql': '' })), code('BAD_MIGRATION_FILE'))
  assert.throws(() => loadMigrations(migrationsDir({ '1_a.sql': '' })), code('BAD_MIGRATION_FILE'))
})
