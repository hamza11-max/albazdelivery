import { test } from 'node:test'
import assert from 'node:assert/strict'

import { computeTotals, discountPercent, needsDiscountOverride, PosError, type Cart } from './index'

const code = (c: string) => (err: unknown) => err instanceof PosError && err.code === c

// Same sale as the Phase 2 sample receipt.
const sample: Cart = {
  lines: [
    { variantId: 'shirt-L', unitPrice: 2500, unitCost: 1200, qty: 2 },
    { variantId: 'shoes-42', unitPrice: 6800, unitCost: 4000, qty: 1 },
    { variantId: 'belt', unitPrice: 1200, unitCost: 500, qty: 1 },
  ],
  saleDiscount: 500,
}

test('sample receipt totals', () => {
  const t = computeTotals(sample)
  assert.equal(t.subtotal, 13_000)
  assert.equal(t.discountTotal, 500)
  assert.equal(t.total, 12_500)
  assert.equal(t.costTotal, 2 * 1200 + 4000 + 500)
})

test('total equals the sum of line nets', () => {
  const t = computeTotals(sample)
  assert.equal(t.lines.reduce((s, l) => s + l.net, 0), t.total)
  assert.equal(t.lines.reduce((s, l) => s + l.allocatedSaleDiscount, 0), 500)
})

test('line discounts apply before the sale discount is spread', () => {
  const t = computeTotals({
    lines: [
      { variantId: 'a', unitPrice: 1000, unitCost: 0, qty: 1, lineDiscount: 1000 },
      { variantId: 'b', unitPrice: 1000, unitCost: 0, qty: 1 },
    ],
    saleDiscount: 100,
  })
  // The free line gets none of the sale discount.
  assert.deepEqual(t.lines.map((l) => l.allocatedSaleDiscount), [0, 100])
  assert.equal(t.total, 900)
})

test('a fully discounted sale totals zero', () => {
  const t = computeTotals({ lines: [{ variantId: 'a', unitPrice: 300, unitCost: 0, qty: 1 }], saleDiscount: 300 })
  assert.equal(t.total, 0)
})

test('rejects empty carts, bad quantities and fractional prices', () => {
  assert.throws(() => computeTotals({ lines: [] }), code('EMPTY_CART'))
  assert.throws(() => computeTotals({ lines: [{ variantId: 'a', unitPrice: 100, unitCost: 0, qty: 0 }] }), code('INVALID_QUANTITY'))
  assert.throws(() => computeTotals({ lines: [{ variantId: 'a', unitPrice: 99.5, unitCost: 0, qty: 1 }] }), code('INVALID_MONEY'))
  assert.throws(() => computeTotals({ lines: [{ variantId: 'a', unitPrice: -100, unitCost: 0, qty: 1 }] }), code('INVALID_MONEY'))
})

test('discounts can never make an amount negative', () => {
  assert.throws(
    () => computeTotals({ lines: [{ variantId: 'a', unitPrice: 100, unitCost: 0, qty: 1, lineDiscount: 101 }] }),
    code('DISCOUNT_TOO_LARGE'),
  )
  assert.throws(
    () => computeTotals({ lines: [{ variantId: 'a', unitPrice: 100, unitCost: 0, qty: 1, lineDiscount: 50 }], saleDiscount: 51 }),
    code('DISCOUNT_TOO_LARGE'),
  )
})

test('discount cap decides when the owner PIN is needed', () => {
  const t = computeTotals(sample) // 500 / 13000 = 3.85 %
  assert.ok(Math.abs(discountPercent(t) - 3.846) < 0.01)
  assert.equal(needsDiscountOverride(t, 5), false)
  assert.equal(needsDiscountOverride(t, 3), true)
})
