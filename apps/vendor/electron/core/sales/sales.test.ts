// Run with Electron's Node (npm run test:db): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PosError, stockFromLedger } from '@albaz/pos-core'
import type Database from 'better-sqlite3'

import { inputs, type ProductDetail, type SaleInput, type Session } from '../../shared/ipc'
import { AuthService } from '../auth/service'
import { CatalogRepo } from '../catalog/repo'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import { recentSales } from './recent'
import { SalesService } from './sales'
import { saveSalesSettings, salesSettings } from './settings'
import { ShiftService } from './shifts'

let db: Database.Database
let auth: AuthService
let shifts: ShiftService
let sales: SalesService
let owner: Session
let cashier: Session
let shirt: ProductDetail

const code = (c: string) => (err: unknown) => (err instanceof AppError || err instanceof PosError) && err.code === c

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-pos-sales-'))
  db = openDatabase(path.join(dir, 'pos.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  auth = new AuthService(db)
  owner = await auth.setup({ shopName: 'Boutique', phone: '0550', address: 'Oran', lang: 'ar', ownerName: 'Amina', pin: '1234' })
  const c = await auth.saveUser({ name: 'Karim', role: 'CASHIER', pin: '5678' })
  cashier = { userId: c.id, name: 'Karim', role: 'CASHIER', since: '' }
  const catalog = new CatalogRepo(db)
  shirt = catalog.saveProduct(inputs['catalog:saveProduct'].parse({
    name: 'قميص', nameAlt: 'Chemise', costPrice: 1200, salePrice: 2500, option1Name: 'Taille',
    variants: [{ option1Value: 'M' }, { option1Value: 'L', salePrice: 2700 }],
  }))
  // 5 of each in stock.
  for (const v of shirt.variants) {
    db.prepare("INSERT INTO stock_movements (id, variant_id, type, qty_delta, user_id, created_at) VALUES (?, ?, 'RECEIVE', 5, ?, ?)").run(uuidv7(), v.id, owner.userId, new Date().toISOString())
    db.prepare('UPDATE variants SET stock_qty = 5 WHERE id = ?').run(v.id)
  }
  shifts = new ShiftService(db)
  sales = new SalesService(db, shifts)
})

const sale = (over: Partial<SaleInput> = {}): SaleInput =>
  inputs['sell:complete'].parse({
    id: uuidv7(),
    lines: [{ variantId: shirt.variants[0]!.id, qty: 2 }, { variantId: shirt.variants[1]!.id, qty: 1 }],
    tenders: [{ method: 'CASH', amount: 10000 }],
    ...over,
  })
const stock = (i: number) => (db.prepare('SELECT stock_qty FROM variants WHERE id = ?').get(shirt.variants[i]!.id) as { stock_qty: number }).stock_qty

test('recent sales for the vendor screens: lines with names, returns negative, voided left out, card-paid marked', async () => {
  shifts.open(cashier, 5000)
  const a = await sales.completeSale(cashier, sale({ saleDiscount: 200 }))
  await sales.completeSale(cashier, sale({ tenders: [{ method: 'CARD_EXTERNAL', amount: 7700 }] }))
  const gone = await sales.completeSale(cashier, sale())
  await sales.voidSale(owner, gone.saleId, 'erreur')
  const line = sales.detail(a.saleId).lines[0]!
  await sales.returnSale(cashier, inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: a.saleId, lines: [{ lineId: line.lineId, qty: 1 }], refundMethod: 'CASH' }))

  const rows = recentSales(db, 1)
  assert.deepEqual(rows.map((r) => [r.type, r.total, r.paymentMethod]), [['RETURN', rows[0]!.total, 'cash'], ['SALE', 7700, 'card'], ['SALE', 7500, 'cash']])
  assert.ok(rows[0]!.total < 0 && rows[0]!.items[0]!.quantity === -1)
  assert.deepEqual(rows[2]!.items.map((i) => [i.productName, i.quantity, i.price]), [['قميص — M', 2, 2500], ['قميص — L', 1, 2700]])
  assert.equal(rows[2]!.items.reduce((s, i) => s + i.discount, 0), 200, 'sale discount spread over the lines')
  assert.deepEqual(recentSales(db, 1, new Date(Date.now() + 3 * 86_400_000)), [], 'outside the window')
})

test('no sale without an open cash register; only one register open at a time', async () => {
  await assert.rejects(sales.completeSale(cashier, sale()), code('NO_OPEN_SHIFT'))
  shifts.open(cashier, 5000)
  assert.throws(() => shifts.open(owner, 1000), code('SHIFT_ALREADY_OPEN'))
})

test('a sale prices from the database, records lines, payments, stock and a receipt number', async () => {
  shifts.open(cashier, 5000)
  const r = await sales.completeSale(cashier, sale())
  // 2 × 2500 + 1 × 2700
  assert.equal(r.total, 7700)
  assert.equal(r.change, 2300)
  assert.match(r.number, /^R-[0-9A-F]{4}-000001$/)
  assert.equal(stock(0), 3)
  assert.equal(stock(1), 4)
  // Stock cache matches the ledger.
  const moves = db.prepare('SELECT type, qty_delta FROM stock_movements WHERE variant_id = ?').all(shirt.variants[0]!.id) as { type: 'SALE' | 'RECEIVE'; qty_delta: number }[]
  assert.equal(stockFromLedger(moves.map((m) => ({ type: m.type, qty: Math.abs(m.qty_delta) }))), 3)
  // Cash payment is what stays in the drawer.
  assert.deepEqual(db.prepare('SELECT method, amount FROM payments').all(), [{ method: 'CASH', amount: 7700 }])
  assert.equal(r.receipt.cashTendered, 10000)
  assert.equal(r.receipt.lines[1]!.variant, 'L')
  assert.equal((db.prepare("SELECT COUNT(*) n FROM outbox WHERE entity = 'sale'").get() as { n: number }).n, 1)
  // The next sale gets the next number.
  assert.match((await sales.completeSale(cashier, sale())).number, /-000002$/)
})

test('sending the same sale twice records it once', async () => {
  shifts.open(cashier, 0)
  const input = sale()
  const a = await sales.completeSale(cashier, input)
  const b = await sales.completeSale(cashier, input)
  assert.equal(a.number, b.number)
  assert.equal((db.prepare('SELECT COUNT(*) n FROM sales').get() as { n: number }).n, 1)
  assert.equal(stock(0), 3, 'stock taken once')
})

test('not enough money, card above the total, and split payments', async () => {
  shifts.open(cashier, 0)
  await assert.rejects(sales.completeSale(cashier, sale({ tenders: [{ method: 'CASH', amount: 7000 }] })), code('INSUFFICIENT_PAYMENT'))
  await assert.rejects(sales.completeSale(cashier, sale({ tenders: [{ method: 'CARD_EXTERNAL', amount: 8000 }] })), code('CARD_OVERPAYMENT'))
  const split = await sales.completeSale(cashier, sale({ tenders: [{ method: 'CARD_EXTERNAL', amount: 5000 }, { method: 'CASH', amount: 3000 }] }))
  assert.equal(split.change, 300)
  assert.deepEqual(db.prepare('SELECT method, amount FROM payments ORDER BY method').all(), [{ method: 'CARD_EXTERNAL', amount: 5000 }, { method: 'CASH', amount: 2700 }])
  assert.equal(stock(0), 3, 'failed attempts did not touch stock')
})

test('cashier discount above the cap needs the owner PIN; it is audited', async () => {
  shifts.open(cashier, 0)
  // 1000 off 7700 = 13 % > 10 % cap
  const big = (pin?: string) => sale({ saleDiscount: 1000, ...(pin ? { ownerPin: pin } : {}) })
  await assert.rejects(sales.completeSale(cashier, big()), (e: unknown) => code('DISCOUNT_NEEDS_OWNER')(e) && (e as Error).message === '10')
  await assert.rejects(sales.completeSale(cashier, big('5678')), code('WRONG_PIN'), "a cashier's own PIN is not enough")
  const ok = await sales.completeSale(cashier, big('1234'))
  assert.equal(ok.total, 6700)
  assert.equal((db.prepare("SELECT COUNT(*) n FROM audit_events WHERE action = 'DISCOUNT_OVER_CAP'").get() as { n: number }).n, 1)
  // The owner needs no PIN for their own discounts; small cashier discounts need none either.
  await sales.completeSale(owner, big())
  await sales.completeSale(cashier, sale({ saleDiscount: 500 }))
})

test('selling more than in stock: allowed by default, refused when the shop turns it off', async () => {
  shifts.open(cashier, 0)
  const many = sale({ lines: [{ variantId: shirt.variants[0]!.id, qty: 7, lineDiscount: 0 }], tenders: [{ method: 'CASH', amount: 20000 }] })
  await sales.completeSale(cashier, many)
  assert.equal(stock(0), -2)
  saveSalesSettings(db, { ...salesSettings(db), allowNegativeStock: false })
  await assert.rejects(sales.completeSale(cashier, sale()), code('OUT_OF_STOCK'))
})

test('archived products cannot be sold', async () => {
  shifts.open(cashier, 0)
  new CatalogRepo(db).archiveProduct(shirt.id)
  await assert.rejects(sales.completeSale(cashier, sale()), code('PRODUCT_UNAVAILABLE'))
})

test('closing: expected cash = float + cash sales ± cash in/out; difference needs a reason', async () => {
  shifts.open(cashier, 5000)
  await sales.completeSale(cashier, sale()) // 7700 cash
  await sales.completeSale(cashier, sale({ tenders: [{ method: 'CARD_EXTERNAL', amount: 7700 }] }))
  shifts.cashMovement(cashier, 'IN', 2000, 'change from bank')
  shifts.cashMovement(cashier, 'OUT', 1000, 'paid delivery')
  assert.throws(() => shifts.cashMovement(cashier, 'OUT', 1_000_000, 'too much'), code('NOT_ENOUGH_CASH'))

  const asCashier = shifts.status(cashier)
  assert.ok(asCashier.open && asCashier.expectedCash === null, 'cashier counts blind')
  const asOwner = shifts.status(owner)
  assert.ok(asOwner.open && asOwner.expectedCash === 13700 && asOwner.salesCount === 2 && asOwner.cardTotal === 7700)

  assert.throws(() => shifts.close(cashier, 13000, ''), (e: unknown) => code('REASON_REQUIRED')(e) && (e as Error).message === '-700')
  const z = shifts.close(cashier, 13000, 'gave wrong change')
  assert.equal(z.difference, -700)
  assert.equal(z.salesTotal, 15400)
  assert.equal(shifts.openShift(), null)
  // Exact count needs no reason on the next shift.
  shifts.open(cashier, 1000)
  assert.equal(shifts.close(cashier, 1000, '').difference, 0)
})

test('held carts: hold, list, recall once', async () => {
  const id = sales.hold(cashier, inputs['sell:hold'].parse({ cart: { lines: [{ variantId: shirt.variants[0]!.id, qty: 1 }], note: 'client rouge' } }).cart)
  const [held] = sales.held()
  assert.equal(held!.userName, 'Karim')
  assert.equal(held!.cart.note, 'client rouge')
  assert.equal(sales.recall(id).cart.lines.length, 1)
  assert.throws(() => sales.recall(id), code('NOT_FOUND'))
})

// ---------- history, void, returns ----------

test('history lists newest first and filters by receipt number', async () => {
  shifts.open(cashier, 0)
  const a = await sales.completeSale(cashier, sale())
  const b = await sales.completeSale(cashier, sale())
  const all = sales.history(inputs['sales:history'].parse({}))
  assert.equal(all.total, 2)
  assert.deepEqual(all.rows.map((r) => r.number), [b.number, a.number])
  assert.equal(all.rows[0]!.items, 3)
  assert.deepEqual(sales.history(inputs['sales:history'].parse({ number: a.number.slice(-6) })).rows.map((r) => r.id), [a.saleId])
  assert.equal(sales.findByNumber(a.number.toLowerCase())?.id, a.saleId)
})

test('void: same shift only, puts stock back, leaves the shift totals, cashier needs the owner PIN', async () => {
  shifts.open(cashier, 5000)
  const r = await sales.completeSale(cashier, sale())
  assert.equal(stock(0), 3)
  await assert.rejects(sales.voidSale(cashier, r.saleId, 'wrong item'), code('VOID_NEEDS_OWNER'))
  const voided = await sales.voidSale(cashier, r.saleId, 'wrong item', '1234')
  assert.equal(voided.status, 'VOIDED')
  assert.equal(voided.voided?.reason, 'wrong item')
  assert.equal(stock(0), 5, 'stock back')
  const z = shifts.summary(shifts.openShift()!.id)
  assert.equal(z.salesCount, 0)
  assert.equal(z.voidsCount, 1)
  assert.equal(z.expectedCash, 5000, 'voided cash is no longer expected in the drawer')
  await assert.rejects(sales.voidSale(owner, r.saleId, 'again'), code('NOT_VOIDABLE'))

  // After the register closes, a sale can only be returned.
  const later = await sales.completeSale(owner, sale())
  shifts.close(owner, shifts.summary(shifts.openShift()!.id).expectedCash, '')
  shifts.open(owner, 0)
  await assert.rejects(sales.voidSale(owner, later.saleId, 'too late'), code('SHIFT_CLOSED'))
})

test('returns refund what was paid per unit, never more than sold, and restock', async () => {
  shifts.open(cashier, 20000)
  // 2 × M at 2500 + 1 × L at 2700 with a 770 sale discount → paid 6930.
  const r = await sales.completeSale(cashier, sale({ saleDiscount: 770 }))
  assert.equal(r.total, 6930)
  const d = sales.detail(r.saleId)
  const m = d.lines[0]!
  const ret = (lines: { lineId: string; qty: number }[], over: object = {}) =>
    sales.returnSale(cashier, inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: r.saleId, lines, refundMethod: 'CASH', ...over }))

  const first = await ret([{ lineId: m.lineId, qty: 1 }])
  assert.equal(first.total, -Math.floor(m.net / 2))
  assert.equal(first.receipt.kind, 'RETURN')
  assert.equal(first.receipt.originalNumber, r.number)
  assert.equal(first.receipt.lines[0]!.qty, 1, 'return slip shows positive quantities')
  assert.equal(stock(0), 4)

  await assert.rejects(ret([{ lineId: m.lineId, qty: 2 }]), code('RETURN_EXCEEDS_SOLD'))
  const second = await ret([{ lineId: m.lineId, qty: 1 }, { lineId: d.lines[1]!.lineId, qty: 1 }])
  // Returning everything refunds exactly what was paid.
  assert.equal(-first.total - second.total, 6930)
  assert.equal(sales.detail(r.saleId).canReturn, false)
  assert.equal(sales.detail(r.saleId).canVoid, false, 'a sale with returns cannot be voided')

  const z = shifts.summary(shifts.openShift()!.id)
  assert.equal(z.returnsCount, 2)
  assert.equal(z.returnsTotal, 6930)
  assert.equal(z.expectedCash, 20000 + 6930 - 6930)
})

test('returns: refund cannot exceed the cash in the drawer; card refunds are allowed', async () => {
  shifts.open(cashier, 0)
  const r = await sales.completeSale(cashier, sale({ tenders: [{ method: 'CARD_EXTERNAL', amount: 7700 }] }))
  const line = sales.detail(r.saleId).lines[0]!
  const input = (method: 'CASH' | 'CARD_EXTERNAL') => inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: r.saleId, lines: [{ lineId: line.lineId, qty: 1 }], refundMethod: method })
  await assert.rejects(sales.returnSale(cashier, input('CASH')), code('NOT_ENOUGH_CASH'))
  const ok = await sales.returnSale(cashier, input('CARD_EXTERNAL'))
  assert.equal(ok.total, -2500)
})

test('returns after the window need the owner PIN when a cashier takes them', async () => {
  shifts.open(cashier, 10000)
  const r = await sales.completeSale(cashier, sale())
  const line = sales.detail(r.saleId).lines[0]!
  // Ten days later.
  const late = new SalesService(db, shifts, () => new Date(Date.now() + 10 * 86_400_000))
  const input = (over: object = {}) => inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: r.saleId, lines: [{ lineId: line.lineId, qty: 1 }], refundMethod: 'CASH', ...over })
  await assert.rejects(late.returnSale(cashier, input()), code('RETURN_NEEDS_OWNER'))
  assert.equal((await late.returnSale(cashier, input({ ownerPin: '1234' }))).total, -2500)
  assert.equal((await late.returnSale(owner, input())).total, -2500, 'the owner needs no PIN')
})

test('a voided sale cannot be returned; a return is idempotent', async () => {
  shifts.open(owner, 10000)
  const r = await sales.completeSale(owner, sale())
  const line = sales.detail(r.saleId).lines[0]!
  const input = inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: r.saleId, lines: [{ lineId: line.lineId, qty: 1 }], refundMethod: 'CASH' })
  const a = await sales.returnSale(owner, input)
  const b = await sales.returnSale(owner, input)
  assert.equal(a.number, b.number)
  assert.equal(sales.detail(r.saleId).returns.length, 1)

  const v = await sales.completeSale(owner, sale())
  await sales.voidSale(owner, v.saleId, 'test')
  const vLine = sales.detail(v.saleId).lines[0]!
  await assert.rejects(sales.returnSale(owner, inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: v.saleId, lines: [{ lineId: vLine.lineId, qty: 1 }], refundMethod: 'CASH' })), code('NOT_RETURNABLE'))
})
