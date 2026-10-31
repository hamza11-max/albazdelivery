import { PosError } from './errors'
import { allocate, assertMoney, assertQuantity, type Money } from './money'

export interface CartLine {
  variantId: string
  unitPrice: Money
  /** Cost at time of sale, kept for margin reports. */
  unitCost: Money
  qty: number
  /** Discount on this line, in dinars. */
  lineDiscount?: Money
}

export interface Cart {
  lines: readonly CartLine[]
  /** Discount on the whole sale, in dinars. */
  saleDiscount?: Money
}

export interface LineTotals {
  /** qty × unitPrice */
  gross: Money
  lineDiscount: Money
  /** This line's share of the sale discount. */
  allocatedSaleDiscount: Money
  /** gross − lineDiscount − allocatedSaleDiscount: what the customer actually paid for the line. */
  net: Money
}

export interface CartTotals {
  lines: LineTotals[]
  /** Σ gross */
  subtotal: Money
  /** Σ line discounts + sale discount */
  discountTotal: Money
  total: Money
  /** Σ qty × unitCost */
  costTotal: Money
}

/**
 * Validates the cart and computes every total. Invariants:
 * - `total = subtotal − discountTotal = Σ line.net`
 * - no line and no sale discount can push an amount below zero
 * - the sale discount is spread over lines in proportion (exact integers), so a
 *   later partial return refunds what the customer actually paid.
 */
export function computeTotals(cart: Cart): CartTotals {
  if (cart.lines.length === 0) throw new PosError('EMPTY_CART', 'Cart has no lines')

  const partial = cart.lines.map((line, i) => {
    assertQuantity(line.qty, `lines[${i}].qty`)
    assertMoney(line.unitPrice, `lines[${i}].unitPrice`)
    assertMoney(line.unitCost, `lines[${i}].unitCost`)
    const gross = assertMoney(line.qty * line.unitPrice, `lines[${i}] amount`)
    const lineDiscount = assertMoney(line.lineDiscount ?? 0, `lines[${i}].lineDiscount`)
    if (lineDiscount > gross) {
      throw new PosError('DISCOUNT_TOO_LARGE', `lines[${i}] discount ${lineDiscount} exceeds line amount ${gross}`)
    }
    return { gross, lineDiscount, cost: line.qty * line.unitCost }
  })

  const afterLineDiscounts = partial.map((p) => p.gross - p.lineDiscount)
  const beforeSaleDiscount = afterLineDiscounts.reduce((s, v) => s + v, 0)
  const saleDiscount = assertMoney(cart.saleDiscount ?? 0, 'saleDiscount')
  if (saleDiscount > beforeSaleDiscount) {
    throw new PosError('DISCOUNT_TOO_LARGE', `Sale discount ${saleDiscount} exceeds amount due ${beforeSaleDiscount}`)
  }
  const shares = allocate(saleDiscount, afterLineDiscounts)

  const lines = partial.map((p, i) => ({
    gross: p.gross,
    lineDiscount: p.lineDiscount,
    allocatedSaleDiscount: shares[i]!,
    net: afterLineDiscounts[i]! - shares[i]!,
  }))
  const subtotal = partial.reduce((s, p) => s + p.gross, 0)
  const discountTotal = partial.reduce((s, p) => s + p.lineDiscount, 0) + saleDiscount

  return {
    lines,
    subtotal,
    discountTotal,
    total: subtotal - discountTotal,
    costTotal: partial.reduce((s, p) => s + p.cost, 0),
  }
}

/** Discount as a percentage of the subtotal (0–100), for the cashier discount cap. */
export function discountPercent(totals: CartTotals): number {
  return totals.subtotal === 0 ? 0 : (totals.discountTotal / totals.subtotal) * 100
}

/** True when the discount is above the cashier's cap and needs the owner's PIN. */
export function needsDiscountOverride(totals: CartTotals, capPercent: number): boolean {
  return discountPercent(totals) > capPercent
}
