import { applyMovement, buildReturn, computeTotals, needsDiscountOverride, settle } from '@albaz/pos-core'
import type Database from 'better-sqlite3'
import { randomBytes } from 'node:crypto'

import type { HeldCart, HistoryQuery, ReturnInput, SaleDetail, SaleInput, SaleResult, SaleSummaryRow, Session } from '../../shared/ipc'
import { verifyPin } from '../auth/pin'
import { getSetting, nextCounter, setSetting } from '../db/database'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import type { ReceiptData } from '../print/receipt'
import { salesSettings } from './settings'
import type { ShiftService } from './shifts'

interface VariantForSale {
  id: string
  product_id: string
  name: string
  name_alt: string | null
  option1_value: string | null
  option2_value: string | null
  price: number
  cost: number
  stock_qty: number
  track_stock: number
}

export class SalesService {
  constructor(
    private readonly db: Database.Database,
    private readonly shifts: ShiftService,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** "R-7F3A-000042": a per-PC code (so two tills never clash later) and a running number. */
  private nextNumber(): string {
    let code = getSetting(this.db, 'device.code')
    if (!code) {
      code = randomBytes(2).toString('hex').toUpperCase()
      setSetting(this.db, 'device.code', code)
    }
    return `R-${code}-${String(nextCounter(this.db, 'sales.seq')).padStart(6, '0')}`
  }

  async completeSale(session: Session, input: SaleInput): Promise<SaleResult> {
    // Same id again (the screen retried): return the sale already recorded.
    if (this.db.prepare('SELECT 1 FROM sales WHERE id = ?').get(input.id)) return this.result(input.id)

    const shift = this.shifts.requireOpen()
    const settings = salesSettings(this.db)
    const getVariant = this.db.prepare(
      `SELECT v.id, v.product_id, p.name, p.name_alt, v.option1_value, v.option2_value,
              coalesce(v.sale_price, p.sale_price) AS price, coalesce(v.cost_price, p.cost_price) AS cost,
              v.stock_qty, p.track_stock
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND v.archived_at IS NULL AND p.archived_at IS NULL`,
    )
    const variants = input.lines.map((l) => {
      const v = getVariant.get(l.variantId) as VariantForSale | undefined
      if (!v) throw new AppError('PRODUCT_UNAVAILABLE', 'A product in the cart is no longer available')
      return v
    })

    // Prices and costs come from the database, never from the screen.
    const totals = computeTotals({
      lines: input.lines.map((l, i) => ({ variantId: l.variantId, unitPrice: variants[i]!.price, unitCost: variants[i]!.cost, qty: l.qty, lineDiscount: l.lineDiscount })),
      saleDiscount: input.saleDiscount,
    })

    let approvedBy: string | null = null
    if (session.role === 'CASHIER' && needsDiscountOverride(totals, settings.cashierDiscountCapPercent)) {
      if (!input.ownerPin) throw new AppError('DISCOUNT_NEEDS_OWNER', String(settings.cashierDiscountCapPercent))
      const owners = this.db.prepare("SELECT id, pin_hash FROM users WHERE role = 'OWNER' AND is_active = 1").all() as { id: string; pin_hash: string }[]
      for (const o of owners) if (await verifyPin(input.ownerPin, o.pin_hash)) approvedBy = o.id
      if (!approvedBy) throw new AppError('WRONG_PIN', 'Owner PIN is not correct')
    }

    const settlement = settle(totals.total, input.tenders)
    const now = this.clock().toISOString()

    this.db.transaction(() => {
      // Checked again inside the transaction: nothing can slip in between.
      if (this.db.prepare('SELECT 1 FROM sales WHERE id = ?').get(input.id)) return
      const number = this.nextNumber()
      this.db
        .prepare(
          `INSERT INTO sales (id, number, type, shift_id, user_id, subtotal, discount_total, total, paid_total, change_given, created_at)
           VALUES (?, ?, 'SALE', ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(input.id, number, shift.id, session.userId, totals.subtotal, totals.discountTotal, totals.total, settlement.paidTotal, settlement.change, now)

      const insertLine = this.db.prepare(
        `INSERT INTO sale_lines (id, sale_id, variant_id, name_snapshot, variant_label_snapshot, qty, unit_price, unit_cost, line_discount, allocated_sale_discount, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      const insertMove = this.db.prepare(
        "INSERT INTO stock_movements (id, variant_id, type, qty_delta, unit_cost, ref_type, ref_id, user_id, created_at) VALUES (?, ?, 'SALE', ?, ?, 'sale', ?, ?, ?)",
      )
      const stockNow = new Map(variants.map((v) => [v.id, v.stock_qty]))
      input.lines.forEach((l, i) => {
        const v = variants[i]!
        const t = totals.lines[i]!
        const label = [v.option1_value, v.option2_value].filter(Boolean).join(' / ')
        // line_total is after the line's own discount; the sale discount share is kept separately.
        insertLine.run(uuidv7(), input.id, v.id, v.name, label || null, l.qty, v.price, v.cost, t.lineDiscount, t.allocatedSaleDiscount, t.gross - t.lineDiscount)
        if (v.track_stock) {
          const after = (() => {
            try {
              return applyMovement(stockNow.get(v.id)!, { type: 'SALE', qty: l.qty }, settings.allowNegativeStock)
            } catch {
              throw new AppError('OUT_OF_STOCK', v.name)
            }
          })()
          stockNow.set(v.id, after)
          insertMove.run(uuidv7(), v.id, -l.qty, v.cost, input.id, session.userId, now)
        }
      })
      const setStock = this.db.prepare('UPDATE variants SET stock_qty = ?, updated_at = ? WHERE id = ?')
      for (const [id, qty] of stockNow) setStock.run(qty, now, id)

      const insertPayment = this.db.prepare('INSERT INTO payments (id, sale_id, method, amount) VALUES (?, ?, ?, ?)')
      // Cash is recorded as what stays in the drawer (tendered − change), so payments add up to the total.
      if (settlement.cashKept > 0) insertPayment.run(uuidv7(), input.id, 'CASH', settlement.cashKept)
      if (settlement.cardTotal > 0) insertPayment.run(uuidv7(), input.id, 'CARD_EXTERNAL', settlement.cardTotal)

      if (approvedBy) {
        this.db
          .prepare("INSERT INTO audit_events (id, user_id, action, entity, entity_id, after_json, created_at) VALUES (?, ?, 'DISCOUNT_OVER_CAP', 'sale', ?, ?, ?)")
          .run(uuidv7(), session.userId, input.id, JSON.stringify({ discountTotal: totals.discountTotal, subtotal: totals.subtotal, approvedBy }), now)
      }
      this.db
        .prepare("INSERT INTO outbox (event_id, entity, entity_id, op, payload_json, created_at) VALUES (?, 'sale', ?, 'UPSERT', ?, ?)")
        .run(uuidv7(), input.id, JSON.stringify({ id: input.id, number, shiftId: shift.id, userId: session.userId, totals, settlement, lines: input.lines, createdAt: now }), now)
    })()

    return this.result(input.id)
  }

  /** What the screen shows after a sale, plus the receipt to print. */
  result(saleId: string): SaleResult {
    const receipt = this.receiptData(saleId)
    return { saleId, number: receipt.number, total: receipt.total, change: receipt.change, receipt }
  }

  receiptData(saleId: string): ReceiptData {
    const sale = this.db
      .prepare(
        `SELECT s.type, s.number, s.created_at, s.subtotal, s.discount_total, s.total, s.paid_total, s.change_given, u.name AS cashier,
                coalesce(o.number, '') AS original_number
         FROM sales s JOIN users u ON u.id = s.user_id LEFT JOIN sales o ON o.id = s.original_sale_id WHERE s.id = ?`,
      )
      .get(saleId) as { type: 'SALE' | 'RETURN'; number: string; created_at: string; subtotal: number; discount_total: number; total: number; paid_total: number; change_given: number; cashier: string; original_number: string } | undefined
    if (!sale) throw new AppError('NOT_FOUND', 'Sale not found')
    const shop = this.db.prepare("SELECT name, phone, address, receipt_footer FROM shop WHERE id = 'shop'").get() as { name: string; phone: string | null; address: string | null; receipt_footer: string | null }
    const lines = this.db
      .prepare(
        `SELECT l.name_snapshot AS name, coalesce(p.name_alt, '') AS nameAlt, coalesce(l.variant_label_snapshot, '') AS variant,
                l.qty, l.unit_price AS unitPrice, l.line_discount AS lineDiscount, l.line_total AS lineTotal
         FROM sale_lines l JOIN variants v ON v.id = l.variant_id JOIN products p ON p.id = v.product_id
         WHERE l.sale_id = ? ORDER BY l.rowid`,
      )
      .all(saleId) as ReceiptData['lines']
    const pay = this.db
      .prepare(
        `SELECT coalesce(SUM(CASE WHEN method = 'CASH' THEN amount END), 0) AS cash,
                coalesce(SUM(CASE WHEN method = 'CARD_EXTERNAL' THEN amount END), 0) AS card
         FROM payments WHERE sale_id = ?`,
      )
      .get(saleId) as { cash: number; card: number }
    const isReturn = sale.type === 'RETURN'
    return {
      kind: sale.type,
      originalNumber: sale.original_number,
      shop: { name: shop.name, phone: shop.phone ?? '', address: shop.address ?? '', footer: shop.receipt_footer ?? '' },
      number: sale.number,
      createdAt: sale.created_at,
      cashier: sale.cashier,
      // A return slip lists what came back with positive quantities and amounts.
      lines: isReturn ? lines.map((l) => ({ ...l, qty: -l.qty, lineTotal: -l.lineTotal })) : lines,
      subtotal: sale.subtotal,
      discountTotal: sale.discount_total,
      total: sale.total,
      cashTendered: pay.cash > 0 ? pay.cash + sale.change_given : 0,
      card: pay.card,
      change: sale.change_given,
    }
  }

  /**
   * Who approves an action a cashier may not do alone: null when the user is
   * the owner, otherwise the id of the active owner whose PIN was given.
   */
  private async ownerApproval(session: Session, ownerPin: string | undefined, missingCode: string): Promise<string | null> {
    if (session.role === 'OWNER') return null
    if (!ownerPin) throw new AppError(missingCode, 'Owner PIN required')
    const owners = this.db.prepare("SELECT id, pin_hash FROM users WHERE role = 'OWNER' AND is_active = 1").all() as { id: string; pin_hash: string }[]
    for (const o of owners) if (await verifyPin(ownerPin, o.pin_hash)) return o.id
    throw new AppError('WRONG_PIN', 'Owner PIN is not correct')
  }

  // ---------- history (spec M13 / §5.2 History) ----------

  history(q: HistoryQuery): { rows: SaleSummaryRow[]; total: number } {
    const where: string[] = []
    const params: unknown[] = []
    if (q.from) {
      where.push('s.created_at >= ?')
      params.push(q.from)
    }
    if (q.to) {
      where.push('s.created_at < ?')
      params.push(q.to)
    }
    if (q.number) {
      where.push('s.number LIKE ?')
      params.push(`%${q.number.replace(/[%_]/g, '')}%`)
    }
    if (q.userId) {
      where.push('s.user_id = ?')
      params.push(q.userId)
    }
    const filter = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const total = (this.db.prepare(`SELECT COUNT(*) AS n FROM sales s ${filter}`).get(...params) as { n: number }).n
    const rows = this.db
      .prepare(
        `SELECT s.id, s.number, s.type, s.status, s.created_at AS createdAt, u.name AS cashier, s.total,
                (SELECT coalesce(SUM(abs(qty)), 0) FROM sale_lines WHERE sale_id = s.id) AS items,
                (SELECT coalesce(SUM(amount), 0) FROM payments WHERE sale_id = s.id AND method = 'CASH') AS cash,
                (SELECT coalesce(SUM(amount), 0) FROM payments WHERE sale_id = s.id AND method = 'CARD_EXTERNAL') AS card,
                coalesce(o.number, '') AS originalNumber
         FROM sales s JOIN users u ON u.id = s.user_id LEFT JOIN sales o ON o.id = s.original_sale_id
         ${filter} ORDER BY s.created_at DESC, s.rowid DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, q.limit, q.offset) as SaleSummaryRow[]
    return { rows, total }
  }

  findByNumber(number: string): { id: string } | null {
    return (this.db.prepare('SELECT id FROM sales WHERE number = ?').get(number.trim().toUpperCase()) as { id: string } | undefined) ?? null
  }

  detail(saleId: string): SaleDetail {
    const s = this.db
      .prepare(
        `SELECT s.*, u.name AS cashier, vb.name AS voided_by_name, o.number AS original_number
         FROM sales s JOIN users u ON u.id = s.user_id LEFT JOIN users vb ON vb.id = s.voided_by LEFT JOIN sales o ON o.id = s.original_sale_id
         WHERE s.id = ?`,
      )
      .get(saleId) as
      | { id: string; number: string; type: 'SALE' | 'RETURN'; status: 'COMPLETED' | 'VOIDED'; created_at: string; cashier: string; shift_id: string
          subtotal: number; discount_total: number; total: number; paid_total: number; change_given: number; voided_at: string | null
          void_reason: string | null; voided_by_name: string | null; original_sale_id: string | null; original_number: string | null }
      | undefined
    if (!s) throw new AppError('NOT_FOUND', 'Sale not found')
    const lines = this.db
      .prepare(
        `SELECT l.id AS lineId, l.variant_id AS variantId, l.name_snapshot AS name, coalesce(l.variant_label_snapshot, '') AS variant,
                l.qty, l.unit_price AS unitPrice, l.line_discount AS lineDiscount, l.line_total AS lineTotal,
                l.line_total - l.allocated_sale_discount AS net,
                coalesce((SELECT -SUM(r.qty) FROM sale_lines r JOIN sales rs ON rs.id = r.sale_id WHERE r.original_line_id = l.id AND rs.status = 'COMPLETED'), 0) AS returnedQty,
                coalesce((SELECT -SUM(r.line_total) FROM sale_lines r JOIN sales rs ON rs.id = r.sale_id WHERE r.original_line_id = l.id AND rs.status = 'COMPLETED'), 0) AS refunded
         FROM sale_lines l WHERE l.sale_id = ? ORDER BY l.rowid`,
      )
      .all(saleId) as SaleDetail['lines']
    const payments = this.db.prepare('SELECT method, amount FROM payments WHERE sale_id = ? ORDER BY rowid').all(saleId) as SaleDetail['payments']
    const returns = this.db
      .prepare("SELECT id, number, created_at AS createdAt, total FROM sales WHERE original_sale_id = ? AND status = 'COMPLETED' ORDER BY created_at")
      .all(saleId) as SaleDetail['returns']
    const open = this.shifts.openShift()
    const windowDays = salesSettings(this.db).returnWindowDays
    return {
      id: s.id,
      number: s.number,
      type: s.type,
      status: s.status,
      createdAt: s.created_at,
      cashier: s.cashier,
      subtotal: s.subtotal,
      discountTotal: s.discount_total,
      total: s.total,
      paidTotal: s.paid_total,
      change: s.change_given,
      lines,
      payments,
      voided: s.voided_at ? { at: s.voided_at, by: s.voided_by_name ?? '', reason: s.void_reason ?? '' } : null,
      originalId: s.original_sale_id,
      originalNumber: s.original_number ?? '',
      returns,
      canVoid: s.type === 'SALE' && s.status === 'COMPLETED' && open?.id === s.shift_id && returns.length === 0,
      canReturn: s.type === 'SALE' && s.status === 'COMPLETED' && lines.some((l) => l.qty - l.returnedQty > 0),
      returnWindowEnds: new Date(new Date(s.created_at).getTime() + windowDays * 86_400_000).toISOString(),
    }
  }

  // ---------- void (spec §8: same shift, owner) ----------

  async voidSale(session: Session, saleId: string, reason: string, ownerPin?: string): Promise<SaleDetail> {
    const sale = this.detail(saleId)
    if (sale.type !== 'SALE' || sale.status !== 'COMPLETED') throw new AppError('NOT_VOIDABLE', 'This sale cannot be voided')
    if (sale.returns.length > 0) throw new AppError('NOT_VOIDABLE', 'This sale has returns')
    if (!sale.canVoid) throw new AppError('SHIFT_CLOSED', 'Only sales from the open register can be voided; take a return instead')
    const approvedBy = await this.ownerApproval(session, ownerPin, 'VOID_NEEDS_OWNER')
    const now = this.clock().toISOString()
    this.db.transaction(() => {
      const r = this.db
        .prepare("UPDATE sales SET status = 'VOIDED', voided_at = ?, void_reason = ?, voided_by = ? WHERE id = ? AND status = 'COMPLETED'")
        .run(now, reason, session.userId, saleId)
      if (r.changes === 0) throw new AppError('NOT_VOIDABLE', 'This sale was already voided')
      this.restock(session, saleId, sale.lines.map((l) => ({ variantId: l.variantId, qty: l.qty })), 'void', now)
      this.db
        .prepare("INSERT INTO audit_events (id, user_id, action, entity, entity_id, after_json, created_at) VALUES (?, ?, 'VOID_SALE', 'sale', ?, ?, ?)")
        .run(uuidv7(), session.userId, saleId, JSON.stringify({ number: sale.number, total: sale.total, reason, approvedBy }), now)
      this.db
        .prepare("INSERT INTO outbox (event_id, entity, entity_id, op, payload_json, created_at) VALUES (?, 'sale', ?, 'UPSERT', ?, ?)")
        .run(uuidv7(), saleId, JSON.stringify({ id: saleId, status: 'VOIDED', voidedAt: now, reason }), now)
    })()
    return this.detail(saleId)
  }

  /** Puts stock back for returned or voided items (RETURN movements). */
  private restock(session: Session, saleId: string, items: { variantId: string; qty: number }[], reason: string, now: string) {
    const track = this.db.prepare('SELECT p.track_stock FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?')
    const move = this.db.prepare(
      "INSERT INTO stock_movements (id, variant_id, type, qty_delta, ref_type, ref_id, reason, user_id, created_at) VALUES (?, ?, 'RETURN', ?, 'sale', ?, ?, ?, ?)",
    )
    const bump = this.db.prepare('UPDATE variants SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?')
    for (const i of items) {
      if (i.qty <= 0 || !(track.get(i.variantId) as { track_stock: number } | undefined)?.track_stock) continue
      move.run(uuidv7(), i.variantId, i.qty, saleId, reason, session.userId, now)
      bump.run(i.qty, now, i.variantId)
    }
  }

  // ---------- returns (spec M9) ----------

  async returnSale(session: Session, input: ReturnInput): Promise<SaleResult> {
    if (this.db.prepare('SELECT 1 FROM sales WHERE id = ?').get(input.id)) return this.result(input.id)
    const shift = this.shifts.requireOpen()
    const original = this.detail(input.originalSaleId)
    if (original.type !== 'SALE' || original.status !== 'COMPLETED') throw new AppError('NOT_RETURNABLE', 'This sale cannot be returned')

    const lateBy = this.clock().getTime() - new Date(original.returnWindowEnds).getTime()
    const approvedBy = lateBy > 0 ? await this.ownerApproval(session, input.ownerPin, 'RETURN_NEEDS_OWNER') : null

    // pos-core: refund what was actually paid per unit, never more than was sold (across all returns).
    const built = buildReturn(
      original.lines.map((l) => ({ lineId: l.lineId, variantId: l.variantId, qty: l.qty, net: l.net })),
      new Map(original.lines.map((l) => [l.lineId, { qty: l.returnedQty, refunded: l.refunded }])),
      input.lines,
    )
    if (built.refundTotal <= 0) throw new AppError('NOTHING_TO_REFUND', 'Nothing to refund')
    if (input.refundMethod === 'CASH' && built.refundTotal > this.shifts.expectedCash(shift)) {
      throw new AppError('NOT_ENOUGH_CASH', 'There is not that much cash in the drawer')
    }

    const byLine = new Map(original.lines.map((l) => [l.lineId, l]))
    const now = this.clock().toISOString()
    this.db.transaction(() => {
      if (this.db.prepare('SELECT 1 FROM sales WHERE id = ?').get(input.id)) return
      const number = this.nextNumber()
      const total = -built.refundTotal
      this.db
        .prepare(
          `INSERT INTO sales (id, number, type, original_sale_id, shift_id, user_id, subtotal, discount_total, total, paid_total, change_given, created_at)
           VALUES (?, ?, 'RETURN', ?, ?, ?, ?, 0, ?, ?, 0, ?)`,
        )
        .run(input.id, number, original.id, shift.id, session.userId, total, total, total, now)
      const insertLine = this.db.prepare(
        `INSERT INTO sale_lines (id, sale_id, variant_id, original_line_id, name_snapshot, variant_label_snapshot, qty, unit_price, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT unit_cost FROM sale_lines WHERE id = ?), ?)`,
      )
      for (const r of built.lines) {
        const o = byLine.get(r.lineId)!
        insertLine.run(uuidv7(), input.id, r.variantId, r.lineId, o.name, o.variant || null, -r.qty, o.unitPrice, r.lineId, -r.refund)
      }
      this.db.prepare('INSERT INTO payments (id, sale_id, method, amount) VALUES (?, ?, ?, ?)').run(uuidv7(), input.id, input.refundMethod, total)
      this.restock(session, input.id, built.lines.map((r) => ({ variantId: r.variantId, qty: r.qty })), 'return', now)
      this.db
        .prepare("INSERT INTO audit_events (id, user_id, action, entity, entity_id, after_json, created_at) VALUES (?, ?, 'RETURN', 'sale', ?, ?, ?)")
        .run(uuidv7(), session.userId, input.id, JSON.stringify({ original: original.number, refund: built.refundTotal, method: input.refundMethod, approvedBy }), now)
      this.db
        .prepare("INSERT INTO outbox (event_id, entity, entity_id, op, payload_json, created_at) VALUES (?, 'sale', ?, 'UPSERT', ?, ?)")
        .run(uuidv7(), input.id, JSON.stringify({ id: input.id, number, type: 'RETURN', originalSaleId: original.id, lines: built.lines, refund: built.refundTotal, method: input.refundMethod, createdAt: now }), now)
    })()
    return this.result(input.id)
  }

  // ---------- held carts (spec M8) ----------

  hold(session: Session, cart: HeldCart['cart']): string {
    const id = uuidv7()
    this.db.prepare('INSERT INTO held_carts (id, user_id, payload_json, created_at) VALUES (?, ?, ?, ?)').run(id, session.userId, JSON.stringify(cart), this.clock().toISOString())
    return id
  }

  held(): HeldCart[] {
    return (this.db
      .prepare('SELECT h.id, h.payload_json, h.created_at, u.name FROM held_carts h JOIN users u ON u.id = h.user_id ORDER BY h.created_at')
      .all() as { id: string; payload_json: string; created_at: string; name: string }[])
      .map((r) => ({ id: r.id, createdAt: r.created_at, userName: r.name, cart: JSON.parse(r.payload_json) as HeldCart['cart'] }))
  }

  /** Takes a held cart back (and removes it from the list). */
  recall(id: string): HeldCart {
    const cart = this.held().find((h) => h.id === id)
    if (!cart) throw new AppError('NOT_FOUND', 'This cart was already recalled')
    this.db.prepare('DELETE FROM held_carts WHERE id = ?').run(id)
    return cart
  }
}
