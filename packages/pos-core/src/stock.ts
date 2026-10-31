import { PosError } from './errors'
import { assertQuantity } from './money'

export type MovementType = 'SALE' | 'RETURN' | 'RECEIVE' | 'ADJUST' | 'DAMAGE'

export interface Movement {
  type: MovementType
  /**
   * Units moved. Positive for SALE / RETURN / RECEIVE / DAMAGE (the type gives
   * the direction); signed for ADJUST (+ found, − missing).
   */
  qty: number
  reason?: string
}

/** Signed change to stock on hand for a movement. */
export function stockDelta(m: Movement): number {
  switch (m.type) {
    case 'SALE':
    case 'DAMAGE':
      return -assertQuantity(m.qty, `${m.type} qty`)
    case 'RETURN':
    case 'RECEIVE':
      return assertQuantity(m.qty, `${m.type} qty`)
    case 'ADJUST':
      if (!Number.isSafeInteger(m.qty) || m.qty === 0) {
        throw new PosError('INVALID_MOVEMENT', `ADJUST qty must be a non-zero whole number (got ${m.qty})`)
      }
      if (!m.reason?.trim()) throw new PosError('REASON_REQUIRED', 'Stock adjustments need a reason')
      return m.qty
    default:
      throw new PosError('INVALID_MOVEMENT', `Unknown movement type ${(m as Movement).type}`)
  }
}

/**
 * New stock on hand after a movement. Selling into negative stock is allowed
 * when the shop allows it (stock counts are often behind reality); other
 * movements may never leave stock negative.
 */
export function applyMovement(onHand: number, m: Movement, allowNegativeSales: boolean): number {
  const next = onHand + stockDelta(m)
  if (next < 0 && !(m.type === 'SALE' && allowNegativeSales)) {
    throw new PosError('NEGATIVE_STOCK', `${m.type} of ${m.qty} would leave ${next} in stock`)
  }
  return next
}

/** Stock on hand rebuilt from the full movement ledger (used to verify the cached value). */
export function stockFromLedger(movements: readonly Movement[]): number {
  return movements.reduce((s, m) => s + stockDelta(m), 0)
}
