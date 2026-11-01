// Run with Electron's Node (npm run test:core): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type Database from 'better-sqlite3'

import { inputs } from '../../shared/ipc'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { adjustStock, archiveFlatItem, flatItems, saveFlatItem } from './flat'
import { CatalogRepo } from './repo'

let db: Database.Database
let repo: CatalogRepo
const OWNER = '00000000-0000-7000-8000-0000000000aa'

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-vendor-flat-'))
  db = openDatabase(path.join(dir, 'vendor.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  repo = new CatalogRepo(db)
  db.prepare("INSERT INTO users (id, name, role, pin_hash, created_at, updated_at) VALUES (?, 'Owner', 'OWNER', '!external', '2026-01-01', '2026-01-01')").run(OWNER)
})

const item = (raw: unknown) => inputs['catalog:saveItem'].parse(raw)
const code = (c: string) => (err: unknown) => err instanceof AppError && err.code === c
const movements = () => db.prepare('SELECT type, qty_delta AS delta, reason FROM stock_movements ORDER BY rowid').all()

test('a new item is a one-variant product; its category is found or created by name', () => {
  const a = saveFlatItem(db, repo, item({ name: 'Sac', category: 'Maroquinerie', sku: 'A-1', barcode: '6130000000015', costPrice: 1800, salePrice: 2500, lowStockThreshold: 2 }), OWNER)
  const b = saveFlatItem(db, repo, item({ name: 'Portefeuille', category: 'maroquinerie ', costPrice: 600, salePrice: 1200 }), OWNER)
  assert.deepEqual([a.displayName, a.category, a.sku, a.costPrice, a.salePrice, a.stock, a.lowStockThreshold], ['Sac', 'Maroquinerie', 'A-1', 1800, 2500, 0, 2])
  assert.equal(b.category, 'Maroquinerie', 'same category, any case')
  assert.ok(b.sku, 'an SKU is generated when left empty')
  assert.equal(repo.categories().length, 1)
  assert.deepEqual(flatItems(db).map((i) => i.name), ['Portefeuille', 'Sac'])
})

test('editing stock records an ADJUST with the reason; an unchanged count records nothing', () => {
  const a = saveFlatItem(db, repo, item({ name: 'Sac', costPrice: 1800, salePrice: 2500, stock: 5 }), OWNER)
  assert.equal(a.stock, 5)
  saveFlatItem(db, repo, item({ variantId: a.variantId, name: 'Sac', costPrice: 1800, salePrice: 2600, stock: 3, stockReason: 'Casse' }), OWNER)
  saveFlatItem(db, repo, item({ variantId: a.variantId, name: 'Sac', costPrice: 1800, salePrice: 2600, stock: 3 }), OWNER)
  assert.deepEqual(movements(), [{ type: 'ADJUST', delta: 5, reason: 'Inventaire' }, { type: 'ADJUST', delta: -2, reason: 'Casse' }])
  assert.equal(flatItems(db)[0]!.salePrice, 2600)
  assert.deepEqual(adjustStock(db, { variantId: a.variantId, newQty: 10, reason: 'Comptage' }, OWNER), { stock: 10, delta: 7 })
})

test('products with sizes show one row per size; a price edit applies to that size only', () => {
  const p = repo.saveProduct(inputs['catalog:saveProduct'].parse({
    name: 'Chemise', costPrice: 1200, salePrice: 2500, option1Name: 'Taille', variants: [{ option1Value: 'M' }, { option1Value: 'L' }],
  }))
  const rows = flatItems(db)
  assert.deepEqual(rows.map((r) => r.displayName), ['Chemise — M', 'Chemise — L'])
  saveFlatItem(db, repo, item({ variantId: rows[1]!.variantId, name: 'Chemise', costPrice: 1200, salePrice: 2700 }), OWNER)
  assert.deepEqual(flatItems(db).map((r) => r.salePrice), [2500, 2700])
  assert.equal(repo.product(p.id).salePrice, 2500, 'product price unchanged')
  // Archiving one size keeps the other; the last size archives the product.
  archiveFlatItem(db, repo, rows[1]!.variantId)
  assert.deepEqual(flatItems(db).map((r) => r.displayName), ['Chemise'])
  archiveFlatItem(db, repo, rows[0]!.variantId)
  assert.deepEqual(flatItems(db), [])
  assert.throws(() => archiveFlatItem(db, repo, rows[0]!.variantId), code('NOT_FOUND'))
})

test('input rules: whole dinars, a price above 0, stock whole and not negative', () => {
  assert.throws(() => item({ name: 'X', costPrice: 0, salePrice: 99.5 }))
  assert.throws(() => item({ name: 'X', costPrice: 0, salePrice: 0 }))
  assert.throws(() => item({ name: 'X', costPrice: 0, salePrice: 100, stock: -1 }))
  assert.throws(() => item({ name: '  ', costPrice: 0, salePrice: 100 }))
})
