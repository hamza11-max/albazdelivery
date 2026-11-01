// Run with Electron's Node (npm run test:core): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PosError } from '@albaz/pos-core'
import type Database from 'better-sqlite3'

import { inputs, type Session } from '../../shared/ipc'
import { AuthService } from '../auth/service'
import { saveFlatItem } from '../catalog/flat'
import { CatalogRepo } from '../catalog/repo'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import { SalesService } from '../sales/sales'
import { ShiftService } from '../sales/shifts'
import { StockService } from '../stock/stock'
import { CustomerService, SupplierService } from './customers'

let db: Database.Database
let owner: Session
let cashier: Session
let shifts: ShiftService
let sales: SalesService
let customers: CustomerService
let suppliers: SupplierService
let bag: string

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-vendor-customers-'))
  db = openDatabase(path.join(dir, 'vendor.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  const auth = new AuthService(db)
  owner = auth.signInExternal({ id: 'owner', name: 'Amina', role: 'OWNER', shopName: 'Boutique' })
  cashier = auth.signInExternal({ id: 'staff-1', name: 'Karim', role: 'CASHIER', shopName: '' })
  bag = saveFlatItem(db, new CatalogRepo(db), inputs['catalog:saveItem'].parse({ name: 'Sac', costPrice: 1800, salePrice: 2500, stock: 10 }), owner.userId).variantId
  shifts = new ShiftService(db)
  sales = new SalesService(db, shifts)
  customers = new CustomerService(db, shifts)
  suppliers = new SupplierService(db)
  shifts.open(cashier, 0)
})

const code = (c: string) => (err: unknown) => (err instanceof AppError || err instanceof PosError) && err.code === c
const customer = (over: object = {}) => customers.save(inputs['customers:save'].parse({ name: 'Fatima', phone: '0550 12 34 56', ...over }), owner.userId)
const sell = (over: object = {}) => sales.completeSale(cashier, inputs['sell:complete'].parse({ id: uuidv7(), lines: [{ variantId: bag, qty: 2 }], tenders: [{ method: 'CASH', amount: 5000 }], ...over }))

test('customers: saved with a normalised phone; a phone belongs to one customer', () => {
  const c = customer()
  assert.equal(c.phone, '0550123456')
  assert.throws(() => customer({ name: 'Autre' }), code('PHONE_EXISTS'))
  assert.equal(customers.save(inputs['customers:save'].parse({ id: c.id, name: 'Fatima B', phone: '0550123456' }), owner.userId).name, 'Fatima B')
  assert.deepEqual(customers.list({ query: 'fat', withDebtOnly: false }).map((x) => x.name), ['Fatima B'])
  assert.deepEqual(customers.list({ query: '0550', withDebtOnly: false }).length, 1)
})

test('a credit sale needs a customer, goes on their account and stays within their limit', async () => {
  await assert.rejects(sell({ tenders: [{ method: 'CREDIT', amount: 5000 }] }), code('CREDIT_NEEDS_CUSTOMER'))
  const c = customer({ creditLimit: 6000 })
  // Part cash, part on account.
  const part = await sell({ customerId: c.id, tenders: [{ method: 'CASH', amount: 1000 }, { method: 'CREDIT', amount: 4000 }] })
  assert.equal(customers.get(c.id).balance, 4000)
  // The receipt shows the customer and what went on their account.
  assert.deepEqual([part.receipt.customer, part.receipt.credit, part.receipt.cashTendered], ['Fatima', 4000, 1000])
  await assert.rejects(sell({ customerId: c.id, tenders: [{ method: 'CREDIT', amount: 5000 }] }), (e: unknown) => code('CREDIT_LIMIT')(e) && (e as Error).message === '2000')
  assert.equal(shifts.expectedCash(shifts.requireOpen()), 1000, 'only the cash part is in the drawer')
  assert.deepEqual(customers.ledger(c.id).map((l) => [l.type, l.amount, l.balanceAfter]), [['CREDIT_SALE', 4000, 4000]])
  assert.equal(customers.get(c.id).salesCount, 1)
})

test('paying off debt: cash goes into the drawer, card does not; no paying more than owed; retries count once', async () => {
  const c = customer()
  await sell({ customerId: c.id, tenders: [{ method: 'CREDIT', amount: 5000 }] })
  const payment = { id: uuidv7(), customerId: c.id, amount: 3000, method: 'CASH' as const, note: '' }
  customers.pay(cashier, payment)
  customers.pay(cashier, payment)
  assert.equal(customers.get(c.id).balance, 2000)
  assert.equal(shifts.expectedCash(shifts.requireOpen()), 3000)
  customers.pay(cashier, { ...payment, id: uuidv7(), amount: 1500, method: 'CARD_EXTERNAL' })
  assert.equal(shifts.expectedCash(shifts.requireOpen()), 3000)
  assert.throws(() => customers.pay(cashier, { ...payment, id: uuidv7(), amount: 600 }), code('OVERPAYMENT'))
  assert.deepEqual(customers.list({ query: '', withDebtOnly: true }).map((x) => x.balance), [500])
})

test('voiding a credit sale takes the debt off; a return can go back on the account', async () => {
  const c = customer()
  const a = await sell({ customerId: c.id, tenders: [{ method: 'CREDIT', amount: 5000 }] })
  await sales.voidSale(owner, a.saleId, 'erreur')
  assert.equal(customers.get(c.id).balance, 0)
  const b = await sell({ customerId: c.id, tenders: [{ method: 'CREDIT', amount: 5000 }] })
  const line = sales.detail(b.saleId).lines[0]!
  await sales.returnSale(cashier, inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: b.saleId, lines: [{ lineId: line.lineId, qty: 1 }], refundMethod: 'CREDIT' }))
  assert.equal(customers.get(c.id).balance, 2500)
  // A sale without a customer can't be refunded on account.
  const cashSale = await sell()
  const cl = sales.detail(cashSale.saleId).lines[0]!
  await assert.rejects(sales.returnSale(cashier, inputs['sales:return'].parse({ id: uuidv7(), originalSaleId: cashSale.saleId, lines: [{ lineId: cl.lineId, qty: 1 }], refundMethod: 'CREDIT' })), code('CREDIT_NEEDS_CUSTOMER'))
})

test('owner corrections need a reason; a customer who owes money cannot be archived; the ledger is append-only', () => {
  const c = customer()
  assert.throws(() => inputs['customers:adjust'].parse({ customerId: c.id, amount: 1200, note: '' }))
  customers.adjust(inputs['customers:adjust'].parse({ customerId: c.id, amount: 1200, note: 'Ancien carnet' }), owner.userId)
  assert.throws(() => customers.archive(c.id, owner.userId), code('CUSTOMER_HAS_BALANCE'))
  assert.throws(() => db.prepare('DELETE FROM customer_ledger').run(), /append-only/)
  customers.adjust(inputs['customers:adjust'].parse({ customerId: c.id, amount: -1200, note: 'Réglé hors caisse' }), owner.userId)
  customers.archive(c.id, owner.userId)
  assert.deepEqual(customers.list({ query: '', withDebtOnly: false }), [])
})

test('suppliers: unique names; a delivery from a saved supplier shows in its totals', () => {
  const s = suppliers.save(inputs['suppliers:save'].parse({ name: 'Grossiste Oran', phone: '041' }), owner.userId)
  assert.throws(() => suppliers.save(inputs['suppliers:save'].parse({ name: 'grossiste oran' }), owner.userId), code('SUPPLIER_EXISTS'))
  new StockService(db).receive(inputs['stock:receive'].parse({ id: uuidv7(), supplierId: s.id, supplierName: suppliers.name(s.id), lines: [{ variantId: bag, qty: 4, unitCost: 1700 }] }), owner.userId)
  assert.deepEqual(suppliers.list().map((x) => [x.name, x.deliveries, x.purchasesTotal]), [['Grossiste Oran', 1, 6800]])
  suppliers.archive(s.id, owner.userId)
  assert.deepEqual(suppliers.list(), [])
  assert.ok(suppliers.save(inputs['suppliers:save'].parse({ name: 'Grossiste Oran' }), owner.userId), 'the name is free again')
})
