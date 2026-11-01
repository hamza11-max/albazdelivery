import type Database from 'better-sqlite3'

import type { CustomerInput, CustomerRow, LedgerEntry, Session, Supplier, SupplierInput } from '../../shared/ipc'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import type { ShiftService } from '../sales/shifts'

/**
 * Customers and their credit book (carnet de crédit). What a customer owes is the sum of their
 * ledger: credit sales add, payments and credit returns subtract. The ledger is append-only;
 * a correction is a new ADJUST row with a reason.
 */
export class CustomerService {
  constructor(
    private readonly db: Database.Database,
    private readonly shifts: ShiftService,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  list(q: { query: string; withDebtOnly: boolean }): CustomerRow[] {
    const like = `%${q.query.trim().toLowerCase()}%`
    return this.db.prepare(`
      SELECT c.id, c.name, coalesce(c.phone, '') AS phone, coalesce(c.note, '') AS note, c.credit_limit AS creditLimit,
             coalesce((SELECT SUM(amount) FROM customer_ledger l WHERE l.customer_id = c.id), 0) AS balance,
             (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id AND s.type = 'SALE' AND s.status = 'COMPLETED') AS salesCount,
             coalesce((SELECT SUM(total) FROM sales s WHERE s.customer_id = c.id AND s.status = 'COMPLETED'), 0) AS salesTotal,
             (SELECT MAX(created_at) FROM sales s WHERE s.customer_id = c.id) AS lastSaleAt,
             c.created_at AS createdAt
      FROM customers c
      WHERE c.archived_at IS NULL AND (? = '%%' OR lower(c.name) LIKE ? OR coalesce(c.phone, '') LIKE ?)
      ORDER BY lower(c.name)`).all(like, like, like)
      .map((r) => r as CustomerRow)
      .filter((r) => !q.withDebtOnly || r.balance > 0)
  }

  get(id: string): CustomerRow {
    const row = this.list({ query: '', withDebtOnly: false }).find((c) => c.id === id)
    if (!row) throw new AppError('NOT_FOUND', 'Customer not found')
    return row
  }

  save(input: CustomerInput, userId: string): CustomerRow {
    const now = this.clock().toISOString()
    const phone = input.phone.replace(/\s+/g, '') || null
    if (phone) {
      const other = this.db.prepare('SELECT id FROM customers WHERE phone = ? AND archived_at IS NULL AND id IS NOT ?').get(phone, input.id ?? null) as { id: string } | undefined
      if (other) throw new AppError('PHONE_EXISTS', 'Another customer has this phone number')
    }
    const id = input.id ?? uuidv7()
    this.db.transaction(() => {
      if (input.id) {
        const r = this.db.prepare('UPDATE customers SET name = ?, phone = ?, note = ?, credit_limit = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL')
          .run(input.name, phone, input.note || null, input.creditLimit, now, id)
        if (r.changes === 0) throw new AppError('NOT_FOUND', 'Customer not found')
      } else {
        this.db.prepare('INSERT INTO customers (id, name, phone, note, credit_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(id, input.name, phone, input.note || null, input.creditLimit, now, now)
      }
      this.audit(userId, input.id ? 'CUSTOMER_EDIT' : 'CUSTOMER_CREATE', 'customer', id, { name: input.name, phone, creditLimit: input.creditLimit }, now)
      this.outbox('customer', id, { id, name: input.name, phone, note: input.note, creditLimit: input.creditLimit }, now)
    })()
    return this.get(id)
  }

  /** Hidden from lists; history keeps it. A customer who still owes money can't be archived. */
  archive(id: string, userId: string): void {
    const c = this.get(id)
    if (c.balance !== 0) throw new AppError('CUSTOMER_HAS_BALANCE', String(c.balance))
    const now = this.clock().toISOString()
    this.db.prepare('UPDATE customers SET archived_at = ?, updated_at = ? WHERE id = ?').run(now, now, id)
    this.audit(userId, 'CUSTOMER_ARCHIVE', 'customer', id, null, now)
  }

  ledger(customerId: string): LedgerEntry[] {
    this.get(customerId)
    return this.db.prepare(`
      SELECT l.id, l.type, l.amount, coalesce(l.method, '') AS method, coalesce(l.note, '') AS note,
             coalesce(s.number, '') AS saleNumber, u.name AS user, l.created_at AS createdAt,
             SUM(l.amount) OVER (ORDER BY l.created_at, l.rowid) AS balanceAfter
      FROM customer_ledger l JOIN users u ON u.id = l.user_id LEFT JOIN sales s ON s.id = l.sale_id
      WHERE l.customer_id = ?
      ORDER BY l.created_at DESC, l.rowid DESC`).all(customerId) as LedgerEntry[]
  }

  /**
   * The customer pays off (part of) what they owe. Cash goes into the drawer as a cash-in on
   * the open register (opened with no float if needed), so the end-of-day count still matches.
   */
  pay(session: Session, input: { id: string; customerId: string; amount: number; method: 'CASH' | 'CARD_EXTERNAL'; note: string }): CustomerRow {
    return this.db.transaction(() => {
      if (this.db.prepare('SELECT 1 FROM customer_ledger WHERE id = ?').get(input.id)) return this.get(input.customerId)
      const c = this.get(input.customerId)
      if (input.amount > c.balance) throw new AppError('OVERPAYMENT', String(c.balance))
      const now = this.clock().toISOString()
      this.db.prepare("INSERT INTO customer_ledger (id, customer_id, type, amount, method, note, user_id, created_at) VALUES (?, ?, 'PAYMENT', ?, ?, ?, ?, ?)")
        .run(input.id, c.id, -input.amount, input.method, input.note || null, session.userId, now)
      if (input.method === 'CASH') {
        if (!this.shifts.status(session).open) this.shifts.open(session, 0)
        this.shifts.cashMovement(session, 'IN', input.amount, `Règlement client: ${c.name}`)
      }
      this.audit(session.userId, 'CUSTOMER_PAYMENT', 'customer', c.id, { amount: input.amount, method: input.method }, now)
      this.outbox('customer_ledger', input.id, { id: input.id, customerId: c.id, type: 'PAYMENT', amount: -input.amount, method: input.method }, now)
      return this.get(c.id)
    })()
  }

  /** Owner correction of a balance (e.g. an old debt from the paper book), with a reason. */
  adjust(input: { customerId: string; amount: number; note: string }, userId: string): CustomerRow {
    if (input.amount === 0) throw new AppError('INVALID', 'Amount must not be 0')
    const now = this.clock().toISOString()
    const c = this.get(input.customerId)
    const id = uuidv7()
    this.db.transaction(() => {
      this.db.prepare("INSERT INTO customer_ledger (id, customer_id, type, amount, note, user_id, created_at) VALUES (?, ?, 'ADJUST', ?, ?, ?, ?)")
        .run(id, c.id, input.amount, input.note, userId, now)
      this.audit(userId, 'CUSTOMER_ADJUST', 'customer', c.id, { amount: input.amount, note: input.note }, now)
      this.outbox('customer_ledger', id, { id, customerId: c.id, type: 'ADJUST', amount: input.amount, note: input.note }, now)
    })()
    return this.get(c.id)
  }

  /** Used by the sale: refuses a credit sale above the customer's limit. */
  assertCredit(customerId: string, extra: number): void {
    const c = this.get(customerId)
    if (c.creditLimit !== null && c.balance + extra > c.creditLimit) throw new AppError('CREDIT_LIMIT', String(c.creditLimit - c.balance))
  }

  private audit(userId: string, action: string, entity: string, entityId: string, after: unknown, now: string) {
    this.db.prepare('INSERT INTO audit_events (id, user_id, action, entity, entity_id, after_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv7(), userId, action, entity, entityId, after === null ? null : JSON.stringify(after), now)
  }

  private outbox(entity: string, entityId: string, payload: unknown, now: string) {
    this.db.prepare("INSERT INTO outbox (event_id, entity, entity_id, op, payload_json, created_at) VALUES (?, ?, ?, 'UPSERT', ?, ?)").run(uuidv7(), entity, entityId, JSON.stringify(payload), now)
  }
}

export class SupplierService {
  constructor(
    private readonly db: Database.Database,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  list(): Supplier[] {
    return this.db.prepare(`
      SELECT s.id, s.name, coalesce(s.phone, '') AS phone, coalesce(s.note, '') AS note,
             (SELECT COUNT(*) FROM stock_receipts r WHERE r.supplier_id = s.id) AS deliveries,
             coalesce((SELECT SUM(total_cost) FROM stock_receipts r WHERE r.supplier_id = s.id), 0) AS purchasesTotal,
             (SELECT MAX(created_at) FROM stock_receipts r WHERE r.supplier_id = s.id) AS lastDeliveryAt
      FROM suppliers s WHERE s.archived_at IS NULL ORDER BY lower(s.name)`).all() as Supplier[]
  }

  save(input: SupplierInput, userId: string): Supplier {
    const now = this.clock().toISOString()
    const clash = this.db.prepare('SELECT 1 FROM suppliers WHERE lower(name) = lower(?) AND archived_at IS NULL AND id IS NOT ?').get(input.name, input.id ?? null)
    if (clash) throw new AppError('SUPPLIER_EXISTS', 'A supplier with this name exists')
    const id = input.id ?? uuidv7()
    if (input.id) {
      const r = this.db.prepare('UPDATE suppliers SET name = ?, phone = ?, note = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL').run(input.name, input.phone || null, input.note || null, now, id)
      if (r.changes === 0) throw new AppError('NOT_FOUND', 'Supplier not found')
    } else {
      this.db.prepare('INSERT INTO suppliers (id, name, phone, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, input.name, input.phone || null, input.note || null, now, now)
    }
    this.db.prepare('INSERT INTO audit_events (id, user_id, action, entity, entity_id, after_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv7(), userId, input.id ? 'SUPPLIER_EDIT' : 'SUPPLIER_CREATE', 'supplier', id, JSON.stringify(input), now)
    return this.list().find((s) => s.id === id)!
  }

  archive(id: string, userId: string): void {
    const now = this.clock().toISOString()
    const r = this.db.prepare('UPDATE suppliers SET archived_at = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL').run(now, now, id)
    if (r.changes === 0) throw new AppError('NOT_FOUND', 'Supplier not found')
    this.db.prepare("INSERT INTO audit_events (id, user_id, action, entity, entity_id, created_at) VALUES (?, ?, 'SUPPLIER_ARCHIVE', 'supplier', ?, ?)").run(uuidv7(), userId, id, now)
  }

  /** The supplier's name for a delivery (also kept on the receipt, so history reads even if renamed). */
  name(id: string): string {
    const s = this.db.prepare('SELECT name FROM suppliers WHERE id = ? AND archived_at IS NULL').get(id) as { name: string } | undefined
    if (!s) throw new AppError('NOT_FOUND', 'Supplier not found')
    return s.name
  }
}
