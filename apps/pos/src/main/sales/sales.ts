import { applyMovement, computeTotals, needsDiscountOverride, settle } from '@albaz/pos-core'
import type Database from 'better-sqlite3'
import { randomBytes } from 'node:crypto'

import type { HeldCart, SaleInput, SaleResult, Session } from '../../shared/ipc'
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
        `SELECT s.number, s.created_at, s.subtotal, s.discount_total, s.total, s.paid_total, s.change_given, u.name AS cashier
         FROM sales s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
      )
      .get(saleId) as { number: string; created_at: string; subtotal: number; discount_total: number; total: number; paid_total: number; change_given: number; cashier: string } | undefined
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
    return {
      shop: { name: shop.name, phone: shop.phone ?? '', address: shop.address ?? '', footer: shop.receipt_footer ?? '' },
      number: sale.number,
      createdAt: sale.created_at,
      cashier: sale.cashier,
      lines,
      subtotal: sale.subtotal,
      discountTotal: sale.discount_total,
      total: sale.total,
      cashTendered: pay.cash > 0 ? pay.cash + sale.change_given : 0,
      card: pay.card,
      change: sale.change_given,
    }
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
