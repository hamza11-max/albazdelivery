// Run with Electron's Node (npm run test:db): better-sqlite3 is built for Electron.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type Database from 'better-sqlite3'

import { inputs, type ProductInput } from '../../shared/ipc'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { CatalogRepo } from './repo'

let db: Database.Database
let repo: CatalogRepo

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-pos-catalog-'))
  db = openDatabase(path.join(dir, 'pos.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  repo = new CatalogRepo(db)
})

/** Parses through the real IPC schema, so tests exercise the same defaults and rules as the app. */
const product = (raw: unknown): ProductInput => inputs['catalog:saveProduct'].parse(raw)
const code = (c: string) => (err: unknown) => err instanceof AppError && err.code === c

const shirt = () =>
  product({
    name: 'قميص قطن أبيض',
    nameAlt: 'Chemise coton blanche',
    brand: 'Albaz',
    costPrice: 1200,
    salePrice: 2500,
    option1Name: 'Taille',
    option2Name: 'Couleur',
    variants: [
      { option1Value: 'M', option2Value: 'Blanc', barcode: '6130000000015' },
      { option1Value: 'L', option2Value: 'Blanc', salePrice: 2700 },
    ],
  })

test('creates a product with variants, generated SKUs, audit and outbox rows', () => {
  const p = repo.saveProduct(shirt())
  assert.equal(p.version, 0)
  assert.equal(p.variants.length, 2)
  assert.match(p.variants[1]!.sku, /^SKU-\d{6}$/)
  assert.notEqual(p.variants[0]!.sku, p.variants[1]!.sku)
  assert.equal(p.variants[1]!.salePrice, 2700)
  assert.equal((db.prepare("SELECT COUNT(*) n FROM audit_events WHERE action = 'PRODUCT_CREATE'").get() as { n: number }).n, 1)
  assert.equal((db.prepare("SELECT COUNT(*) n FROM outbox WHERE entity = 'product'").get() as { n: number }).n, 1)
})

test('search: Arabic without hamza, French without accents, prefixes, SKU and barcode', () => {
  repo.saveProduct(shirt())
  repo.saveProduct(product({ name: 'حذاء رياضي', nameAlt: 'Baskets été', costPrice: 4000, salePrice: 6800, variants: [{ sku: 'SHOE-42' }] }))
  const names = (query: string) => repo.products(inputs['catalog:products'].parse({ query })).rows.map((r) => r.nameAlt)
  assert.deepEqual(names('ابيض'), ['Chemise coton blanche']) // stored as أبيض
  assert.deepEqual(names('ete'), ['Baskets été'])
  assert.deepEqual(names('chem bla'), ['Chemise coton blanche'])
  assert.deepEqual(names('shoe'), ['Baskets été'])
  assert.deepEqual(names('6130000000015'), ['Chemise coton blanche'])
  assert.equal(names('').length, 2)
  assert.deepEqual(names('nothing-like-this'), [])
})

test('summary shows price range, variant count and stock', () => {
  repo.saveProduct(shirt())
  const [row] = repo.products(inputs['catalog:products'].parse({})).rows
  assert.equal(row!.minPrice, 2500)
  assert.equal(row!.maxPrice, 2700)
  assert.equal(row!.variantCount, 2)
  assert.equal(row!.stockTotal, 0)
  assert.equal(row!.outOfStockVariants, 2)
})

test('duplicate barcode or SKU across products is refused with a clear message', () => {
  repo.saveProduct(shirt())
  assert.throws(
    () => repo.saveProduct(product({ name: 'Autre', costPrice: 0, salePrice: 100, variants: [{ barcode: '6130000000015' }] })),
    (err: unknown) => code('DUPLICATE_BARCODE')(err) && /قميص/.test((err as Error).message),
  )
  const sku = repo.product(repo.products(inputs['catalog:products'].parse({})).rows[0]!.id).variants[0]!.sku
  assert.throws(() => repo.saveProduct(product({ name: 'Autre', costPrice: 0, salePrice: 100, variants: [{ sku }] })), code('DUPLICATE_SKU'))
})

test('schema rejects bad variant input before it reaches the database', () => {
  assert.throws(() => product({ name: 'X', costPrice: 0, salePrice: 100, option1Name: 'Taille', variants: [{ option1Value: '' }] }))
  assert.throws(() => product({ name: 'X', costPrice: 0, salePrice: 100, option1Name: 'Taille', variants: [{ option1Value: 'M' }, { option1Value: 'm' }] }))
  assert.throws(() => product({ name: 'X', costPrice: 0, salePrice: 0, variants: [{}] }))
  assert.throws(() => product({ name: 'X', costPrice: 0, salePrice: 100, variants: [{ barcode: 'has space' }] }))
})

test('update: version check, price-edit audit, removed variants are archived not deleted', () => {
  const p = repo.saveProduct(shirt())
  const updated = repo.saveProduct(
    product({
      ...p,
      salePrice: 2600,
      variants: [{ ...p.variants[0]! }], // drop the L variant
    }),
  )
  assert.equal(updated.version, 1)
  assert.equal(updated.variants.length, 1)
  const archived = db.prepare('SELECT archived_at FROM variants WHERE id = ?').get(p.variants[1]!.id) as { archived_at: string | null }
  assert.ok(archived.archived_at, 'dropped variant archived')
  assert.equal((db.prepare("SELECT COUNT(*) n FROM audit_events WHERE action = 'PRICE_EDIT'").get() as { n: number }).n, 1)

  // Saving again with the old version is a conflict.
  assert.throws(() => repo.saveProduct(product({ ...p, salePrice: 9999 })), code('CONFLICT'))
})

test('renaming a product updates search', () => {
  const p = repo.saveProduct(shirt())
  repo.saveProduct(product({ ...p, nameAlt: 'Polo rayé' }))
  const names = (query: string) => repo.products(inputs['catalog:products'].parse({ query })).rows.length
  assert.equal(names('chemise'), 0)
  assert.equal(names('raye'), 1)
})

test('findByCode finds by barcode or SKU, trims scanner input', () => {
  const p = repo.saveProduct(shirt())
  assert.equal(repo.findByCode('  6130000000015\n')?.variantId, p.variants[0]!.id)
  assert.equal(repo.findByCode(p.variants[1]!.sku)?.variantId, p.variants[1]!.id)
  assert.equal(repo.findByCode('0000'), null)
})

test('archived products disappear from lists and lookups', () => {
  const p = repo.saveProduct(shirt())
  repo.archiveProduct(p.id)
  assert.equal(repo.products(inputs['catalog:products'].parse({})).total, 0)
  assert.equal(repo.findByCode('6130000000015'), null)
  assert.throws(() => repo.product(p.id), code('NOT_FOUND'))
})

test('generated barcodes are valid in-store EAN-13s and never repeat', () => {
  const a = repo.newBarcode()
  const b = repo.newBarcode()
  assert.match(a, /^2\d{12}$/)
  assert.notEqual(a, b)
})

test('categories: unique names, cannot archive while in use', () => {
  const cat = repo.saveCategory({ name: 'Chemises' })
  assert.throws(() => repo.saveCategory({ name: 'chemises' }), code('DUPLICATE_CATEGORY'))
  repo.saveProduct(product({ ...shirt(), categoryId: cat.id }))
  assert.equal(repo.categories()[0]!.productCount, 1)
  assert.throws(() => repo.archiveCategory(cat.id), code('CATEGORY_IN_USE'))
  const [row] = repo.products(inputs['catalog:products'].parse({ categoryId: cat.id })).rows
  assert.equal(row!.categoryName, 'Chemises')
})
