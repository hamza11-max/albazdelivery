// Run with Electron's Node (npm run test:db): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'
import type Database from 'better-sqlite3'

import { inputs } from '../../shared/ipc'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { commitImport, mapHeaders, parseAmount, planImport, templateWorkbook } from './import'
import { CatalogRepo } from './repo'
import { assertSafeZip, decodeText, parseCsv, readSpreadsheet } from './spreadsheet'

let db: Database.Database
let repo: CatalogRepo

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-pos-import-'))
  db = openDatabase(path.join(dir, 'pos.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  repo = new CatalogRepo(db)
})

/** A signed-in user for imports that record stock. */
const owner = () => {
  const id = '00000000-0000-7000-8000-0000000000aa'
  db.prepare("INSERT OR IGNORE INTO users (id, name, role, pin_hash, created_at, updated_at) VALUES (?, 'Owner', 'OWNER', 'x', ?, ?)").run(id, '2026-01-01', '2026-01-01')
  return id
}
const code = (c: string) => (err: unknown) => err instanceof AppError && err.code === c
const csv = (text: string) => readSpreadsheet(Buffer.from(text, 'utf8'), 'p.csv')

// ---------- reading ----------

test('CSV: detects ; and , delimiters, quotes, BOM and CRLF', () => {
  assert.deepEqual(parseCsv('a;b\r\n1;"x;y"'), [['a', 'b'], ['1', 'x;y']])
  assert.deepEqual(parseCsv('a,b\n"he said ""hi""",2\n'), [['a', 'b'], ['he said "hi"', '2']])
  assert.equal(decodeText(Buffer.from('﻿nom', 'utf8')), 'nom')
})

test('CSV saved by Excel in the Arabic Windows code page is decoded', () => {
  // "قميص" in windows-1256: 0xDE 0E3 0ED 0D5
  const bytes = Buffer.from([0x6e, 0x3b, 0xde, 0xe3, 0xed, 0xd5, 0xde, 0xe3, 0xed, 0xd5])
  assert.match(decodeText(bytes), /قميص/)
})

test('xlsx: reads values, uses saved formula results, never evaluates', async () => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('P')
  ws.addRow(['Nom', 'Prix'])
  ws.addRow(['Chemise', { formula: '1000+1500', result: 2500 }])
  ws.addRow(['Barcode', 6130000000015])
  const sheet = await readSpreadsheet(Buffer.from(await wb.xlsx.writeBuffer()), 'p.xlsx')
  assert.deepEqual(sheet.headers, ['Nom', 'Prix'])
  assert.deepEqual(sheet.rows[0], { row: 2, cells: ['Chemise', '2500'] })
  assert.equal(sheet.rows[1]!.cells[1], '6130000000015')
})

test('zip bomb: entries claiming huge sizes are refused before parsing', async () => {
  const good = Buffer.from(await (await (async () => { const wb = new ExcelJS.Workbook(); wb.addWorksheet('a').addRow(['x']); return wb })()).xlsx.writeBuffer())
  assert.doesNotThrow(() => assertSafeZip(good))
  const bomb = Buffer.from(good)
  // Rewrite every central-directory entry's uncompressed size to 1 GB.
  for (let i = 0; i < bomb.length - 4; i++) if (bomb.readUInt32LE(i) === 0x02014b50) bomb.writeUInt32LE(1_000_000_000, i + 24)
  assert.throws(() => assertSafeZip(bomb), code('FILE_TOO_LARGE'))
  await assert.rejects(readSpreadsheet(bomb, 'bomb.xlsx'), code('FILE_TOO_LARGE'))
})

test('rejects unknown file types, garbage xlsx and empty files', async () => {
  await assert.rejects(readSpreadsheet(Buffer.from('x'), 'p.pdf'), code('UNSUPPORTED_FILE'))
  await assert.rejects(readSpreadsheet(Buffer.from('not a zip'), 'p.xlsx'), code('INVALID_FILE'))
  await assert.rejects(csv('\n \n'), code('EMPTY_FILE'))
})

// ---------- planning ----------

test('headers match in French, Arabic or English, including "FR / AR" headers', () => {
  const { columns, issues } = mapHeaders(['Nom / الاسم', 'سعر البيع', 'Code-barres', 'Catégorie'])
  assert.deepEqual(issues, [])
  assert.equal(columns.get('name'), 0)
  assert.equal(columns.get('salePrice'), 1)
  assert.equal(columns.get('barcode'), 2)
  assert.equal(columns.get('category'), 3)
  assert.deepEqual(mapHeaders(['Marque']).issues.map((i) => i.field), ['name', 'salePrice'])
})

test('amounts: spaces, thousand separators, currency; fractions refused', () => {
  assert.equal(parseAmount('2 500'), 2500)
  assert.equal(parseAmount('2.500'), 2500)
  assert.equal(parseAmount('12,500'), 12500)
  assert.equal(parseAmount('2500,00'), 2500)
  assert.equal(parseAmount('2500 DA'), 2500)
  assert.equal(parseAmount('2 500 د.ج'), 2500)
  assert.equal(parseAmount('99.5'), 'fraction')
  assert.equal(parseAmount('abc'), 'invalid')
  assert.equal(parseAmount(''), null)
})

test('the template imports cleanly: rows grouped into products, categories created, all in one go', async () => {
  const sheet = await readSpreadsheet(await templateWorkbook(), 'template.xlsx')
  const plan = planImport(sheet, repo, db)
  assert.deepEqual(plan.preview.errors, [])
  assert.equal(plan.preview.products, 2)
  assert.equal(plan.preview.variants, 3)
  assert.deepEqual(plan.preview.newCategories.sort(), ['Accessoires', 'Chemises'])

  assert.equal(plan.preview.stockUnits, 10)
  assert.throws(() => commitImport(plan, repo, db), code('UNAUTHENTICATED'), 'opening stock needs a signed-in user')
  assert.deepEqual(commitImport(plan, repo, db, owner()), { products: 2, variants: 3, stockUnits: 10 })
  const shirt = repo.products(inputs['catalog:products'].parse({ query: 'chemise' })).rows[0]!
  assert.equal(shirt.variantCount, 2)
  assert.equal(shirt.maxPrice, 2700)
  assert.equal(shirt.categoryName, 'Chemises')
  assert.equal(repo.findByCode('6130000000015')?.product.nameAlt, 'Ceinture cuir')
  // Opening stock: M = 6, L = 4, belt = 0; one 'import' stock receipt with RECEIVE movements.
  assert.deepEqual(repo.product(shirt.id).variants.map((v) => v.stockQty), [6, 4])
  const receipt = db.prepare("SELECT total_cost FROM stock_receipts WHERE reference = 'import'").get() as { total_cost: number }
  assert.equal(receipt.total_cost, 10 * 1200)
  assert.equal((db.prepare("SELECT COUNT(*) n FROM stock_movements WHERE type = 'RECEIVE'").get() as { n: number }).n, 2)
})

test('vendor-style inventory files import: Désignation, Code article, PA, PV, Qté, Seuil', async () => {
  const sheet = await csv(['Code article;Désignation;Famille;PA;PV;Qté;Seuil', 'A-001;Sac à main;Maroquinerie;1.800;2.500;7;2', 'A-002;Portefeuille;Maroquinerie;600;1 200;;'].join('\n'))
  const plan = planImport(sheet, repo, db)
  assert.deepEqual(plan.preview.errors, [])
  assert.equal(plan.preview.stockUnits, 7)
  commitImport(plan, repo, db, owner())
  const bag = repo.findByCode('A-001')!
  assert.equal(bag.product.costPrice, 1800, '"1.800" is 1 800 dinars, not 1.8')
  assert.equal(bag.product.salePrice, 2500)
  assert.equal(bag.product.variants[0]!.stockQty, 7)
  assert.equal(bag.product.variants[0]!.lowStockThreshold, 2)
  assert.equal(repo.findByCode('A-002')!.product.variants[0]!.stockQty, 0)
})

test('opening stock must be whole units', async () => {
  const plan = planImport(await csv('Nom,Prix de vente,Stock\nX,100,2.5'), repo, db)
  assert.equal(plan.preview.errors[0]?.code, 'NOT_WHOLE')
})

test('errors are reported per Excel row and block the whole import', async () => {
  repo.saveProduct(inputs['catalog:saveProduct'].parse({ name: 'Old', costPrice: 0, salePrice: 100, variants: [{ barcode: '111' }] }))
  const sheet = await csv(
    [
      'Nom;Prix de vente;Option 1;Valeur 1;Code-barres;Catégorie',
      'Chemise;2500;Taille;M;222;A', // row 2 ok
      'Chemise;2600;Taille;L;;A', // row 3: price differs from row 2
      'Pantalon;99.5;;;;', // row 4: fraction
      ';100;;;;', // row 5: no name
      'Jupe;1500;;;111;', // row 6: barcode already in the shop
      'Robe;1500;;;222;', // row 7: barcode repeated in the file
      'Polo;1500;Taille;;;', // row 8: option value missing
    ].join('\n'),
  )
  const plan = planImport(sheet, repo, db)
  const byRow = Object.fromEntries(plan.preview.errors.map((e) => [e.row, e.code]))
  assert.equal(byRow[3], 'CONFLICTING_VALUE')
  assert.equal(byRow[4], 'NOT_WHOLE')
  assert.equal(byRow[5], 'REQUIRED')
  assert.equal(byRow[6], 'BARCODE_EXISTS')
  assert.equal(byRow[7], 'DUPLICATE_BARCODE')
  assert.equal(byRow[8], 'INVALID')
  assert.equal(byRow[2], undefined)
  assert.throws(() => commitImport(plan, repo, db), code('IMPORT_HAS_ERRORS'))
  assert.equal(repo.products(inputs['catalog:products'].parse({})).total, 1, 'nothing imported')
})

test('a failure while saving rolls back every product from the file', async () => {
  const sheet = await csv('Nom,Prix de vente,Code-barres\nA,100,333\nB,100,444')
  const plan = planImport(sheet, repo, db)
  // Someone adds barcode 444 between preview and import.
  repo.saveProduct(inputs['catalog:saveProduct'].parse({ name: 'Late', costPrice: 0, salePrice: 100, variants: [{ barcode: '444' }] }))
  assert.throws(() => commitImport(plan, repo, db), (e: unknown) => code('DUPLICATE_BARCODE')(e) && /Row 3/.test((e as Error).message))
  assert.equal(repo.findByCode('333'), null, 'row 2 was rolled back too')
})
