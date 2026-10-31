// Run with Electron's Node (npm run test:db): better-sqlite3 is built for Electron.
// Checks that the schema itself enforces the spec's money and history rules,
// so a bug in application code cannot store bad data.
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type Database from 'better-sqlite3'

import { openDatabase } from './database'
import { loadMigrations, migrate } from './migrate'

const NOW = '2026-10-31T12:00:00.000Z'
let db: Database.Database

before(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-pos-schema-'))
  db = openDatabase(path.join(dir, 'pos.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  db.prepare("INSERT INTO users (id, name, role, pin_hash, created_at, updated_at) VALUES ('u1', 'Owner', 'OWNER', 'x', ?, ?)").run(NOW, NOW)
  db.prepare("INSERT INTO products (id, name, sale_price, created_at, updated_at) VALUES ('p1', 'Shirt', 2500, ?, ?)").run(NOW, NOW)
  db.prepare("INSERT INTO variants (id, product_id, sku, barcode, created_at, updated_at) VALUES ('v1', 'p1', 'SHIRT-L', '6130000000017', ?, ?)").run(NOW, NOW)
})

const rejects = (sql: string, ...params: unknown[]) => assert.throws(() => db.prepare(sql).run(...params), /constraint|append-only|never deleted|immutable|only be voided|cannot store/i)

test('foreign keys are enforced', () => {
  assert.throws(
    () => db.prepare("INSERT INTO variants (id, product_id, sku, created_at, updated_at) VALUES ('v9', 'nope', 'X', ?, ?)").run(NOW, NOW),
    /FOREIGN KEY/,
  )
})

test('money is whole, non-negative dinars', () => {
  rejects("INSERT INTO products (id, name, sale_price, created_at, updated_at) VALUES ('p2', 'Bad', 0, ?, ?)", NOW, NOW)
  rejects("INSERT INTO products (id, name, sale_price, cost_price, created_at, updated_at) VALUES ('p3', 'Bad', 100, -1, ?, ?)", NOW, NOW)
  // STRICT tables refuse fractional values in INTEGER columns.
  rejects("INSERT INTO products (id, name, sale_price, created_at, updated_at) VALUES ('p4', 'Bad', 99.5, ?, ?)", NOW, NOW)
})

test('SKU and barcode are unique', () => {
  rejects("INSERT INTO variants (id, product_id, sku, created_at, updated_at) VALUES ('v2', 'p1', 'SHIRT-L', ?, ?)", NOW, NOW)
  rejects("INSERT INTO variants (id, product_id, sku, barcode, created_at, updated_at) VALUES ('v3', 'p1', 'OTHER', '6130000000017', ?, ?)", NOW, NOW)
})

test('stock movements: direction matches type, adjustments need a reason, history is append-only', () => {
  const ins = "INSERT INTO stock_movements (id, variant_id, type, qty_delta, reason, user_id, created_at) VALUES (?, 'v1', ?, ?, ?, 'u1', ?)"
  db.prepare(ins).run('m1', 'RECEIVE', 10, null, NOW)
  rejects(ins, 'm2', 'SALE', 2, null, NOW)
  rejects(ins, 'm3', 'RECEIVE', -2, null, NOW)
  rejects(ins, 'm4', 'ADJUST', -1, '  ', NOW)
  db.prepare(ins).run('m5', 'ADJUST', -1, 'count', NOW)
  rejects("UPDATE stock_movements SET qty_delta = 99 WHERE id = 'm1'")
  rejects("DELETE FROM stock_movements WHERE id = 'm1'")
})

test('only one shift can be open, and closing must balance or give a reason', () => {
  const open = "INSERT INTO shifts (id, opened_by, opened_at, opening_float) VALUES (?, 'u1', ?, 5000)"
  db.prepare(open).run('s1', NOW)
  rejects(open, 's2', NOW)
  rejects("UPDATE shifts SET closed_by = 'u1', closed_at = ?, expected_cash = 5000, counted_cash = 4000, difference = -1000 WHERE id = 's1'", NOW)
  rejects("UPDATE shifts SET closed_by = 'u1', closed_at = ?, expected_cash = 5000, counted_cash = 4000, difference = 0, difference_reason = 'x' WHERE id = 's1'", NOW)
  db.prepare("UPDATE shifts SET closed_by = 'u1', closed_at = ?, expected_cash = 5000, counted_cash = 4000, difference = -1000, difference_reason = 'wrong change' WHERE id = 's1'").run(NOW)
  db.prepare(open).run('s2', NOW) // allowed once s1 is closed
})

test('sales: totals must add up, cash must cover the total, and a sale can only be voided', () => {
  const ins = `INSERT INTO sales (id, number, type, original_sale_id, shift_id, user_id, subtotal, discount_total, total, paid_total, change_given, created_at)
               VALUES (?, ?, ?, ?, 's2', 'u1', ?, ?, ?, ?, ?, ?)`
  db.prepare(ins).run('sale1', 'R-1', 'SALE', null, 13000, 500, 12500, 15000, 2500, NOW)
  rejects(ins, 'sale2', 'R-2', 'SALE', null, 13000, 500, 12000, 15000, 3000, NOW) // total ≠ subtotal − discount
  rejects(ins, 'sale3', 'R-3', 'SALE', null, 13000, 500, 12500, 12000, 0, NOW) // underpaid
  rejects(ins, 'sale4', 'R-4', 'RETURN', null, -966, 0, -966, -966, 0, NOW) // return without original
  db.prepare(ins).run('ret1', 'R-5', 'RETURN', 'sale1', -966, 0, -966, -966, 0, NOW)

  rejects("UPDATE sales SET total = 1 WHERE id = 'sale1'")
  rejects("UPDATE sales SET status = 'VOIDED', voided_at = ?, voided_by = 'u1' WHERE id = 'sale1'", NOW) // no reason
  db.prepare("UPDATE sales SET status = 'VOIDED', voided_at = ?, void_reason = 'wrong item', voided_by = 'u1' WHERE id = 'sale1'").run(NOW)
  rejects("UPDATE sales SET status = 'COMPLETED', voided_at = NULL, void_reason = NULL, voided_by = NULL WHERE id = 'sale1'")
  rejects("DELETE FROM sales WHERE id = 'ret1'")
})

test('audit log is append-only', () => {
  db.prepare("INSERT INTO audit_events (id, user_id, action, created_at) VALUES ('a1', 'u1', 'VOID_SALE', ?)").run(NOW)
  rejects("UPDATE audit_events SET action = 'X' WHERE id = 'a1'")
  rejects("DELETE FROM audit_events WHERE id = 'a1'")
})

test('outbox event ids are unique and sequence numbers increase', () => {
  const ins = "INSERT INTO outbox (event_id, entity, entity_id, op, payload_json, created_at) VALUES (?, 'sale', 'sale1', 'UPSERT', '{}', ?)"
  const a = db.prepare(ins).run('e1', NOW).lastInsertRowid
  const b = db.prepare(ins).run('e2', NOW).lastInsertRowid
  assert.ok(Number(b) > Number(a))
  assert.throws(() => db.prepare(ins).run('e1', NOW), /UNIQUE/)
})
