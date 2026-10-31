import { PosError } from './errors'

/** Whole Algerian dinars. Never a float: every amount in the POS is an integer. */
export type Money = number

/** Largest amount accepted anywhere (10 billion DZD); keeps sums far from float precision limits. */
export const MAX_MONEY = 10_000_000_000

export function assertMoney(value: number, field: string): Money {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_MONEY) {
    throw new PosError('INVALID_MONEY', `${field} must be a whole, non-negative amount of dinars (got ${value})`)
  }
  return value
}

export function assertQuantity(value: number, field: string, max = 9_999): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new PosError('INVALID_QUANTITY', `${field} must be a whole number from 1 to ${max} (got ${value})`)
  }
  return value
}

/**
 * Splits `total` across `weights` in proportion, as integers that sum exactly
 * to `total` (largest-remainder method; ties go to the earlier index).
 */
export function allocate(total: Money, weights: readonly number[]): Money[] {
  const sum = weights.reduce((s, w) => s + w, 0)
  if (total === 0 || sum === 0) return weights.map(() => 0)
  const exact = weights.map((w) => (total * w) / sum)
  const result = exact.map(Math.floor)
  let remainder = total - result.reduce((s, v) => s + v, 0)
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of order) {
    if (remainder === 0) break
    result[i]! += 1
    remainder--
  }
  return result
}
