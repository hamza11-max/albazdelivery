import { PosError } from './errors'
import { assertMoney, type Money } from './money'

export interface ShiftCash {
  openingFloat: Money
  /** Σ Settlement.cashKept for sales in the shift. */
  cashFromSales: Money
  /** Σ cash refunds for returns in the shift. */
  cashRefunds: Money
  /** Σ cash put into the drawer (e.g. change top-up). */
  cashIn: Money
  /** Σ cash taken out (e.g. paying a supplier). */
  cashOut: Money
}

/** Cash that should be in the drawer at close. */
export function expectedCash(s: ShiftCash): Money {
  assertMoney(s.openingFloat, 'openingFloat')
  assertMoney(s.cashFromSales, 'cashFromSales')
  assertMoney(s.cashRefunds, 'cashRefunds')
  assertMoney(s.cashIn, 'cashIn')
  assertMoney(s.cashOut, 'cashOut')
  return s.openingFloat + s.cashFromSales - s.cashRefunds + s.cashIn - s.cashOut
}

export interface ShiftClose {
  expected: Money
  counted: Money
  /** counted − expected: negative means cash is missing. */
  difference: Money
}

/**
 * Closes a shift against the counted cash. Any difference needs a reason, so
 * missing cash is always explained in the audit trail.
 */
export function closeShift(expected: Money, counted: Money, reason?: string): ShiftClose {
  assertMoney(counted, 'counted')
  const difference = counted - expected
  if (difference !== 0 && !reason?.trim()) {
    throw new PosError('REASON_REQUIRED', `Cash is off by ${difference}; a reason is required`)
  }
  return { expected, counted, difference }
}
