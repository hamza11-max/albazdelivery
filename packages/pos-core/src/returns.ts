import { PosError } from './errors'
import { assertQuantity, type Money } from './money'

/** One line of the original sale, as stored. */
export interface SoldLine {
  lineId: string
  variantId: string
  qty: number
  /** What the customer paid for the whole line after all discounts (`LineTotals.net`). */
  net: Money
}

/** What earlier returns already took back from a sold line. */
export interface ReturnedSoFar {
  qty: number
  refunded: Money
}

export interface ReturnRequest {
  lineId: string
  qty: number
}

export interface ReturnLine {
  lineId: string
  variantId: string
  qty: number
  refund: Money
}

/** Units still returnable per line id. */
export function returnableQty(
  sold: readonly SoldLine[],
  returned: ReadonlyMap<string, ReturnedSoFar>,
): Map<string, number> {
  return new Map(sold.map((l) => [l.lineId, l.qty - (returned.get(l.lineId)?.qty ?? 0)]))
}

/**
 * Builds a return against an earlier sale. Refunds are what the customer paid
 * per unit (after line and sale discounts). Rounding is settled on the last
 * unit: returning a whole line, in any number of steps, refunds exactly its net.
 */
export function buildReturn(
  sold: readonly SoldLine[],
  returned: ReadonlyMap<string, ReturnedSoFar>,
  requests: readonly ReturnRequest[],
): { lines: ReturnLine[]; refundTotal: Money } {
  const byId = new Map(sold.map((l) => [l.lineId, l]))
  const requested = new Map<string, number>()
  requests.forEach((r, i) => {
    assertQuantity(r.qty, `requests[${i}].qty`)
    if (!byId.has(r.lineId)) throw new PosError('UNKNOWN_LINE', `Line ${r.lineId} is not on the original sale`)
    requested.set(r.lineId, (requested.get(r.lineId) ?? 0) + r.qty)
  })

  const lines: ReturnLine[] = []
  for (const [lineId, qty] of requested) {
    const line = byId.get(lineId)!
    const prior = returned.get(lineId) ?? { qty: 0, refunded: 0 }
    const remainingQty = line.qty - prior.qty
    if (qty > remainingQty) {
      throw new PosError('RETURN_EXCEEDS_SOLD', `Line ${lineId}: returning ${qty}, only ${remainingQty} left`)
    }
    const remainingMoney = line.net - prior.refunded
    const refund = qty === remainingQty ? remainingMoney : Math.floor((line.net * qty) / line.qty)
    lines.push({ lineId, variantId: line.variantId, qty, refund: Math.min(refund, remainingMoney) })
  }

  return { lines, refundTotal: lines.reduce((s, l) => s + l.refund, 0) }
}
