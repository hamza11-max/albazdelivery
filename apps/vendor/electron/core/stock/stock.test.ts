// Run with Electron's Node (npm run test:core): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type Database from 'better-sqlite3'

import { inputs } from '../../shared/ipc'
import { flatItems, saveFlatItem } from '../catalog/flat'
import { CatalogRepo } from '../catalog/repo'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import { StockService } from './stock'

let db: Database.Database
let repo: CatalogRepo
let stock: StockService
let bag: string
let belt: string
const OWNER = '00000000-0000-7000-8000-0000000000aa'

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-vendor-stock-'))
  db = openDatabase(path.join(dir, 'vendor.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  repo = new CatalogRepo(db)
  stock = new StockService(db)
  db.prepare("INSERT INTO users (id, name, role, pin_hash, created_at, updated_at) VALUES (?, 'Amina', 'OWNER', '!external', '2026-01-01', '2026-01-01')").run(OWNER)
  const item = (raw: unknown) => saveFlatItem(db, repo, inputs['catalog:saveItem'].parse(raw), OWNER).variantId
  bag = item({ name: 'Sac', costPrice: 1800, salePrice: 2500, lowStockThreshold: 2, stock: 5 })
  belt = item({ name: 'Ceinture', costPrice: 400, salePrice: 900 })
})

const code = (c: string) => (err: unknown) => err instanceof AppError && err.code === c
const stockOf = (id: string) => flatItems(db).find((i) => i.variantId === id)!.stock
const receipt = (over: object = {}) => inputs['stock:receive'].parse({
  id: uuidv7(), supplierName: 'Grossiste Oran', reference: 'BL-17', lines: [{ variantId: bag, qty: 10, unitCost: 1700 }, { variantId: belt, qty: 3 }], ...over,
})

test('a delivery adds stock, records RECEIVE movements, totals its cost and updates the item cost', () => {
  const r = stock.receive(receipt(), OWNER)
  assert.deepEqual([r.units, r.totalCost], [13, 10 * 1700 + 3 * 400])
  assert.deepEqual([stockOf(bag), stockOf(belt)], [15, 3])
  assert.equal(flatItems(db).find((i) => i.variantId === bag)!.costPrice, 1700, 'new cost from the delivery')
  assert.equal(flatItems(db).find((i) => i.variantId === belt)!.costPrice, 400, 'no cost given: unchanged')
  const moves = stock.movements({ limit: 10 })
  assert.deepEqual(moves.filter((m) => m.type === 'RECEIVE').map((m) => [m.name, m.delta, m.supplier, m.reference]).sort(), [['Ceinture', 3, 'Grossiste Oran', 'BL-17'], ['Sac', 10, 'Grossiste Oran', 'BL-17']])
})

test('sending the same delivery twice records it once', () => {
  const input = receipt()
  const a = stock.receive(input, OWNER)
  const b = stock.receive(input, OWNER)
  assert.deepEqual(a, b)
  assert.equal(stockOf(bag), 15)
})

test('a delivery for an unknown item records nothing', () => {
  assert.throws(() => stock.receive(receipt({ lines: [{ variantId: bag, qty: 1 }, { variantId: uuidv7(), qty: 1 }] }), OWNER), code('NOT_FOUND'))
  assert.equal(stockOf(bag), 5)
  assert.equal((db.prepare('SELECT COUNT(*) n FROM stock_receipts').get() as { n: number }).n, 0)
})

test('low stock: out of stock first, then at or under the alert level', () => {
  assert.deepEqual(stock.low().map((i) => i.name), ['Ceinture'])
  db.prepare("INSERT INTO stock_movements (id, variant_id, type, qty_delta, user_id, created_at) VALUES (?, ?, 'DAMAGE', -3, ?, ?)").run(uuidv7(), bag, OWNER, new Date().toISOString())
  db.prepare('UPDATE variants SET stock_qty = 2 WHERE id = ?').run(bag)
  assert.deepEqual(stock.low().map((i) => [i.name, i.stock]), [['Ceinture', 0], ['Sac', 2]])
})

test('a count adjusts only counted items, against stock at the end; one count at a time', () => {
  const c = stock.startCount('Fin de mois', OWNER)
  assert.deepEqual(c.lines.map((l) => [l.name, l.expected, l.counted]).sort(), [['Ceinture', 0, null], ['Sac', 5, null]])
  assert.throws(() => stock.startCount('', OWNER), code('COUNT_ALREADY_OPEN'))
  stock.setCounted(c.id, bag, 4)
  // A delivery arrives during the count: the bag goes to 7; the shelf count (4) must win.
  stock.receive(receipt({ lines: [{ variantId: bag, qty: 2 }] }), OWNER)
  assert.deepEqual(stock.finishCount(c.id, OWNER), { adjusted: 1, unitsDelta: -3 })
  assert.deepEqual([stockOf(bag), stockOf(belt)], [4, 0])
  assert.throws(() => stock.setCounted(c.id, bag, 1), code('COUNT_NOT_OPEN'))
  assert.equal(stock.openCount(), null)
  // The ledger still adds up to the cached stock.
  assert.equal((db.prepare('SELECT SUM(qty_delta) AS n FROM stock_movements WHERE variant_id = ?').get(bag) as { n: number }).n, 4)
})

test('a cancelled count changes nothing', () => {
  const c = stock.startCount('', OWNER)
  stock.setCounted(c.id, bag, 0)
  stock.cancelCount(c.id, OWNER)
  assert.equal(stockOf(bag), 5)
  assert.ok(stock.startCount('', OWNER), 'a new count can start')
})
