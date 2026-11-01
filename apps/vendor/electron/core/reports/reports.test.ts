// Run with Electron's Node (npm run test:core): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type Database from 'better-sqlite3'

import { inputs, type Session } from '../../shared/ipc'
import { AuthService } from '../auth/service'
import { saveFlatItem } from '../catalog/flat'
import { CatalogRepo } from '../catalog/repo'
import { CustomerService } from '../customers/customers'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { uuidv7 } from '../ids'
import { SalesService } from '../sales/sales'
import { ShiftService } from '../sales/shifts'
import { report } from './reports'

let db: Database.Database
let owner: Session
let karim: Session
let sales: SalesService
let bag: string
let belt: string
let customerId: string
let now: Date

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-vendor-reports-'))
  db = openDatabase(path.join(dir, 'vendor.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  const auth = new AuthService(db)
  owner = auth.signInExternal({ id: 'owner', name: 'Amina', role: 'OWNER', shopName: 'Boutique' })
  karim = auth.signInExternal({ id: 'staff-1', name: 'Karim', role: 'CASHIER', shopName: '' })
  const repo = new CatalogRepo(db)
  const item = (raw: object) => saveFlatItem(db, repo, inputs['catalog:saveItem'].parse(raw), owner.userId).variantId
  bag = item({ name: 'Sac', category: 'Maroquinerie', costPrice: 1800, salePrice: 2500, stock: 10 })
  belt = item({ name: 'Ceinture', category: 'Accessoires', costPrice: 400, salePrice: 900, stock: 10 })
  now = new Date('2026-11-01T10:00:00Z')
  const shifts = new ShiftService(db, () => now)
  sales = new SalesService(db, shifts, () => now)
  shifts.open(karim, 0)
  customerId = new CustomerService(db, shifts).save(inputs['customers:save'].parse({ name: 'Fatima' }), owner.userId).id
})

const sell = (who: Session, lines: { variantId: string; qty: number }[], over: object = {}) =>
  sales.completeSale(who, inputs['sell:complete'].parse({ id: uuidv7(), lines, tenders: [{ method: 'CASH', amount: 100_000 }], ...over }))

test('totals: net revenue after discounts and returns, cost from the sale lines, payments by method, voids apart', async () => {
  // Sale 1 (Karim, cash): 2 bags = 5000, 400 off → 4600; cost 3600.
  const s1 = await sell(karim, [{ variantId: bag, qty: 2 }], { saleDiscount: 400 })
  // Sale 2 (Amina, card): 1 belt = 900; cost 400.
  await sell(owner, [{ variantId: belt, qty: 1 }], { tenders: [{ method: 'CARD_EXTERNAL', amount: 900 }] })
  // Sale 3 (Karim, on Fatima's account): 1 bag = 2500; cost 1800.
  await sell(karim, [{ variantId: bag, qty: 1 }], { customerId, tenders: [{ method: 'CREDIT', amount: 2500 }] })
  // Sale 4: voided, must not count.
  const s4 = await sell(karim, [{ variantId: belt, qty: 3 }])
  await sales.voidSale(owner, s4.saleId, 'erreur')
  // Return of one bag from sale 1: refunds what was paid for it, 2300; cost back 1800.
  const line = sales.detail(s1.saleId).lines[0]!
  await sales.returnSale(karim, inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: s1.saleId, lines: [{ lineId: line.lineId, qty: 1 }], refundMethod: 'CASH' }))
  // Costs changing later doesn't move past margins.
  db.prepare("UPDATE products SET cost_price = 9999 WHERE name = 'Sac'").run()

  const r = report(db, '2026-11-01T00:00:00.000Z', '2026-11-02T00:00:00.000Z')
  assert.deepEqual(
    { ...r.totals },
    {
      salesCount: 3, returnsCount: 1, gross: 5000 + 900 + 2500, discounts: 400, returns: 2300,
      revenue: 4600 + 900 + 2500 - 2300, cost: 3600 + 400 + 1800 - 1800, margin: 5700 - 4000, marginPercent: 29.8,
      averageBasket: Math.round(8000 / 3), cash: 4600 - 2300, card: 900, credit: 2500, voidedCount: 1, voidedTotal: 2700,
    },
  )
  assert.deepEqual(r.products.map((p) => [p.name, p.qty, p.revenue, p.margin]), [['Sac', 2, 4800, 1200], ['Ceinture', 1, 900, 500]])
  assert.deepEqual(r.categories.map((c) => [c.category, c.revenue]), [['Maroquinerie', 4800], ['Accessoires', 900]])
  assert.deepEqual(r.cashiers.map((c) => [c.name, c.count, c.revenue, c.discounts]), [['Karim', 2, 4800, 400], ['Amina', 1, 900, 0]])
  assert.deepEqual(r.customers.map((c) => [c.name, c.count, c.revenue, c.balance]), [['Fatima', 1, 2500, 2500]])
  assert.equal(r.daily.length, 1)
  assert.deepEqual([r.daily[0]!.count, r.daily[0]!.revenue, r.daily[0]!.margin], [3, 5700, 1700])
  assert.deepEqual(r.payments, [{ method: 'credit', count: 1, amount: 2500 }, { method: 'cash', count: 2, amount: 2300 }, { method: 'card', count: 1, amount: 900 }])
  assert.equal(r.sales.length, 4, '3 sales and the return; the void is only in the totals')
  // Every amount adds up: daily and products agree with the totals.
  assert.equal(r.products.reduce((s, p) => s + p.revenue, 0), r.totals.revenue)
})

test('only the period counts; stock value is now', async () => {
  await sell(karim, [{ variantId: bag, qty: 1 }])
  const before = report(db, '2026-10-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z')
  assert.deepEqual([before.totals.salesCount, before.totals.revenue, before.products.length], [0, 0, 0])
  // 9 bags at cost 1800 / price 2500, 10 belts at 400 / 900.
  assert.deepEqual(before.stockValue, { units: 19, atCost: 9 * 1800 + 10 * 400, atPrice: 9 * 2500 + 10 * 900 })
  assert.throws(() => inputs['reports:period'].parse({ from: '2026-11-02T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' }))
})
