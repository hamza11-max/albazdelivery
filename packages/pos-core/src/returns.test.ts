import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildReturn, computeTotals, PosError, returnableQty, type ReturnedSoFar, type SoldLine } from './index'

const code = (c: string) => (err: unknown) => err instanceof PosError && err.code === c

// 3 shirts at 1 000 with a 100 sale discount: net 2 900, i.e. 966.67 per unit.
const sold: SoldLine[] = [
  { lineId: 'L1', variantId: 'shirt', qty: 3, net: 2_900 },
  { lineId: 'L2', variantId: 'belt', qty: 1, net: 1_200 },
]
const none = new Map<string, ReturnedSoFar>()

test('refund uses what the customer actually paid per unit', () => {
  const r = buildReturn(sold, none, [{ lineId: 'L1', qty: 1 }])
  assert.deepEqual(r.lines, [{ lineId: 'L1', variantId: 'shirt', qty: 1, refund: 966 }])
  assert.equal(r.refundTotal, 966)
})

test('returning a line in steps refunds exactly its net, no rounding drift', () => {
  const first = buildReturn(sold, none, [{ lineId: 'L1', qty: 1 }])
  const after1 = new Map([['L1', { qty: 1, refunded: first.refundTotal }]])
  const second = buildReturn(sold, after1, [{ lineId: 'L1', qty: 1 }])
  const after2 = new Map([['L1', { qty: 2, refunded: first.refundTotal + second.refundTotal }]])
  const third = buildReturn(sold, after2, [{ lineId: 'L1', qty: 1 }])
  assert.equal(first.refundTotal + second.refundTotal + third.refundTotal, 2_900)
})

test('cannot return more than was sold, across several returns', () => {
  assert.throws(() => buildReturn(sold, none, [{ lineId: 'L1', qty: 4 }]), code('RETURN_EXCEEDS_SOLD'))
  const after = new Map([['L1', { qty: 3, refunded: 2_900 }]])
  assert.throws(() => buildReturn(sold, after, [{ lineId: 'L1', qty: 1 }]), code('RETURN_EXCEEDS_SOLD'))
  // Same line requested twice in one return counts together.
  assert.throws(
    () => buildReturn(sold, none, [{ lineId: 'L1', qty: 2 }, { lineId: 'L1', qty: 2 }]),
    code('RETURN_EXCEEDS_SOLD'),
  )
})

test('unknown lines and bad quantities are rejected', () => {
  assert.throws(() => buildReturn(sold, none, [{ lineId: 'nope', qty: 1 }]), code('UNKNOWN_LINE'))
  assert.throws(() => buildReturn(sold, none, [{ lineId: 'L1', qty: 0 }]), code('INVALID_QUANTITY'))
})

test('returnableQty reflects earlier returns', () => {
  const left = returnableQty(sold, new Map([['L1', { qty: 2, refunded: 1_933 }]]))
  assert.equal(left.get('L1'), 1)
  assert.equal(left.get('L2'), 1)
})

test('full return of a discounted sale refunds the exact total paid', () => {
  const totals = computeTotals({
    lines: [
      { variantId: 'shirt-L', unitPrice: 2500, unitCost: 0, qty: 2 },
      { variantId: 'shoes-42', unitPrice: 6800, unitCost: 0, qty: 1 },
      { variantId: 'belt', unitPrice: 1200, unitCost: 0, qty: 1 },
    ],
    saleDiscount: 500,
  })
  const lines: SoldLine[] = totals.lines.map((l, i) => ({ lineId: `L${i}`, variantId: `v${i}`, qty: i === 0 ? 2 : 1, net: l.net }))
  const r = buildReturn(lines, none, lines.map((l) => ({ lineId: l.lineId, qty: l.qty })))
  assert.equal(r.refundTotal, totals.total)
})
