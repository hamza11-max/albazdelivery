import { closeShift, expectedCash } from '@albaz/pos-core'
import type Database from 'better-sqlite3'

import type { Session, ShiftClosed, ShiftStatus } from '../../shared/ipc'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'

interface ShiftRow {
  id: string
  opened_by: string
  opened_at: string
  opening_float: number
}

/**
 * The cash drawer's session (spec M12): one open shift at a time. Sales and
 * cash in/out belong to the open shift; closing compares counted cash with
 * what should be there.
 */
export class ShiftService {
  constructor(
    private readonly db: Database.Database,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  openShift(): ShiftRow | null {
    return (this.db.prepare('SELECT id, opened_by, opened_at, opening_float FROM shifts WHERE closed_at IS NULL').get() as ShiftRow | undefined) ?? null
  }

  requireOpen(): ShiftRow {
    const s = this.openShift()
    if (!s) throw new AppError('NO_OPEN_SHIFT', 'Open the cash register first')
    return s
  }

  /** Totals for a shift, from its sales, payments and cash movements. */
  private totals(shiftId: string) {
    const sales = this.db
      .prepare(
        `SELECT COUNT(*) AS count, coalesce(SUM(total), 0) AS total
         FROM sales WHERE shift_id = ? AND type = 'SALE' AND status = 'COMPLETED'`,
      )
      .get(shiftId) as { count: number; total: number }
    const pay = this.db
      .prepare(
        `SELECT
           coalesce(SUM(CASE WHEN p.method = 'CASH' AND p.amount > 0 THEN p.amount END), 0) AS cashIn,
           coalesce(SUM(CASE WHEN p.method = 'CASH' AND p.amount < 0 THEN -p.amount END), 0) AS cashOut,
           coalesce(SUM(CASE WHEN p.method = 'CARD_EXTERNAL' THEN p.amount END), 0) AS card
         FROM payments p JOIN sales s ON s.id = p.sale_id
         WHERE s.shift_id = ? AND s.status = 'COMPLETED'`,
      )
      .get(shiftId) as { cashIn: number; cashOut: number; card: number }
    const moves = this.db
      .prepare(
        `SELECT coalesce(SUM(CASE WHEN type = 'IN' THEN amount END), 0) AS cashIn,
                coalesce(SUM(CASE WHEN type = 'OUT' THEN amount END), 0) AS cashOut
         FROM cash_movements WHERE shift_id = ?`,
      )
      .get(shiftId) as { cashIn: number; cashOut: number }
    const returns = this.db
      .prepare(
        `SELECT COUNT(*) AS count, coalesce(SUM(-total), 0) AS total
         FROM sales WHERE shift_id = ? AND type = 'RETURN' AND status = 'COMPLETED'`,
      )
      .get(shiftId) as { count: number; total: number }
    const voids = this.db
      .prepare("SELECT COUNT(*) AS count, coalesce(SUM(total), 0) AS total FROM sales WHERE shift_id = ? AND status = 'VOIDED'")
      .get(shiftId) as { count: number; total: number }
    return { sales, pay, moves, returns, voids }
  }

  /** Cash that should be in the drawer now (refunds are paid out of it). */
  expectedCash(shift: ShiftRow): number {
    return this.expected(shift)
  }

  /** End-of-shift report for any shift, open or closed (the Z-report). */
  summary(shiftId: string): ShiftClosed {
    const row = this.db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as
      | (ShiftRow & { closed_at: string | null; expected_cash: number | null; counted_cash: number | null; difference: number | null; difference_reason: string | null; closed_by: string | null })
      | undefined
    if (!row) throw new AppError('NOT_FOUND', 'Shift not found')
    const { sales, pay, moves, returns, voids } = this.totals(shiftId)
    const name = (id: string | null) => (id ? ((this.db.prepare('SELECT name FROM users WHERE id = ?').get(id) as { name: string } | undefined)?.name ?? '') : '')
    const expected = row.expected_cash ?? this.expected(row)
    return {
      id: row.id,
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? '',
      openedBy: name(row.opened_by),
      closedBy: name(row.closed_by),
      openingFloat: row.opening_float,
      salesCount: sales.count,
      salesTotal: sales.total,
      returnsCount: returns.count,
      returnsTotal: returns.total,
      voidsCount: voids.count,
      voidsTotal: voids.total,
      cashFromSales: pay.cashIn,
      cashRefunds: pay.cashOut,
      cardTotal: pay.card,
      cashIn: moves.cashIn,
      cashOut: moves.cashOut,
      expectedCash: expected,
      countedCash: row.counted_cash ?? 0,
      difference: row.difference ?? 0,
      differenceReason: row.difference_reason ?? '',
    }
  }

  private expected(shift: ShiftRow): number {
    const { pay, moves } = this.totals(shift.id)
    return expectedCash({ openingFloat: shift.opening_float, cashFromSales: pay.cashIn, cashRefunds: pay.cashOut, cashIn: moves.cashIn, cashOut: moves.cashOut })
  }

  /** Cashiers count blind: only the owner sees the expected cash before closing. */
  status(session: Session): ShiftStatus {
    const shift = this.openShift()
    if (!shift) return { open: false }
    const { sales, pay } = this.totals(shift.id)
    const openedBy = (this.db.prepare('SELECT name FROM users WHERE id = ?').get(shift.opened_by) as { name: string }).name
    return {
      open: true,
      id: shift.id,
      openedAt: shift.opened_at,
      openedBy,
      openingFloat: shift.opening_float,
      salesCount: sales.count,
      salesTotal: sales.total,
      cardTotal: pay.card,
      expectedCash: session.role === 'OWNER' ? this.expected(shift) : null,
    }
  }

  open(session: Session, openingFloat: number): void {
    const now = this.clock().toISOString()
    try {
      this.db.transaction(() => {
        const id = uuidv7()
        this.db.prepare('INSERT INTO shifts (id, opened_by, opened_at, opening_float) VALUES (?, ?, ?, ?)').run(id, session.userId, now, openingFloat)
        this.audit(session.userId, 'SHIFT_OPEN', id, { openingFloat })
      })()
    } catch (err) {
      if (/UNIQUE/.test(String(err))) throw new AppError('SHIFT_ALREADY_OPEN', 'The cash register is already open')
      throw err
    }
  }

  cashMovement(session: Session, type: 'IN' | 'OUT', amount: number, reason: string): void {
    const shift = this.requireOpen()
    if (type === 'OUT' && amount > this.expected(shift)) throw new AppError('NOT_ENOUGH_CASH', 'There is not that much cash in the drawer')
    this.db.transaction(() => {
      this.db
        .prepare('INSERT INTO cash_movements (id, shift_id, type, amount, reason, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv7(), shift.id, type, amount, reason, session.userId, this.clock().toISOString())
      this.audit(session.userId, type === 'IN' ? 'CASH_IN' : 'CASH_OUT', shift.id, { amount, reason })
    })()
  }

  /**
   * Closes the open shift. Any difference between counted and expected cash
   * needs a reason; without one the error carries the difference so the UI
   * can ask for it (the cashier has already counted by then).
   */
  close(session: Session, countedCash: number, reason: string): ShiftClosed {
    const shift = this.requireOpen()
    const expected = this.expected(shift)
    if (countedCash !== expected && !reason.trim()) throw new AppError('REASON_REQUIRED', String(countedCash - expected))
    const result = closeShift(expected, countedCash, reason)
    const now = this.clock().toISOString()
    this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE shifts SET closed_by = ?, closed_at = ?, expected_cash = ?, counted_cash = ?, difference = ?, difference_reason = ?
           WHERE id = ? AND closed_at IS NULL`,
        )
        .run(session.userId, now, expected, countedCash, result.difference, reason.trim() || null, shift.id)
      this.audit(session.userId, 'SHIFT_CLOSE', shift.id, { expected, countedCash, difference: result.difference, reason })
    })()
    return this.summary(shift.id)
  }

  private audit(userId: string, action: string, shiftId: string, after: unknown) {
    this.db
      .prepare("INSERT INTO audit_events (id, user_id, action, entity, entity_id, after_json, created_at) VALUES (?, ?, ?, 'shift', ?, ?, ?)")
      .run(uuidv7(), userId, action, shiftId, JSON.stringify(after), this.clock().toISOString())
  }
}
