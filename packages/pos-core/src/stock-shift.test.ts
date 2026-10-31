import { test } from 'node:test'
import assert from 'node:assert/strict'

import { applyMovement, closeShift, expectedCash, PosError, stockDelta, stockFromLedger, type Movement } from './index'

const code = (c: string) => (err: unknown) => err instanceof PosError && err.code === c

test('movement directions', () => {
  assert.equal(stockDelta({ type: 'SALE', qty: 2 }), -2)
  assert.equal(stockDelta({ type: 'DAMAGE', qty: 1 }), -1)
  assert.equal(stockDelta({ type: 'RETURN', qty: 1 }), 1)
  assert.equal(stockDelta({ type: 'RECEIVE', qty: 24 }), 24)
  assert.equal(stockDelta({ type: 'ADJUST', qty: -3, reason: 'count' }), -3)
})

test('adjustments need a reason and a non-zero amount', () => {
  assert.throws(() => stockDelta({ type: 'ADJUST', qty: 2 }), code('REASON_REQUIRED'))
  assert.throws(() => stockDelta({ type: 'ADJUST', qty: 2, reason: '  ' }), code('REASON_REQUIRED'))
  assert.throws(() => stockDelta({ type: 'ADJUST', qty: 0, reason: 'count' }), code('INVALID_MOVEMENT'))
})

test('directional movements take positive whole quantities only', () => {
  assert.throws(() => stockDelta({ type: 'SALE', qty: -1 }), code('INVALID_QUANTITY'))
  assert.throws(() => stockDelta({ type: 'RECEIVE', qty: 1.5 }), code('INVALID_QUANTITY'))
})

test('selling into negative stock only when the shop allows it', () => {
  assert.equal(applyMovement(1, { type: 'SALE', qty: 2 }, true), -1)
  assert.throws(() => applyMovement(1, { type: 'SALE', qty: 2 }, false), code('NEGATIVE_STOCK'))
})

test('other movements never leave stock negative', () => {
  assert.throws(() => applyMovement(1, { type: 'DAMAGE', qty: 2 }, true), code('NEGATIVE_STOCK'))
  assert.throws(() => applyMovement(1, { type: 'ADJUST', qty: -2, reason: 'theft' }, true), code('NEGATIVE_STOCK'))
})

test('ledger rebuild matches step-by-step stock', () => {
  const ledger: Movement[] = [
    { type: 'RECEIVE', qty: 10 },
    { type: 'SALE', qty: 3 },
    { type: 'RETURN', qty: 1 },
    { type: 'DAMAGE', qty: 1 },
    { type: 'ADJUST', qty: -2, reason: 'count' },
  ]
  let onHand = 0
  for (const m of ledger) onHand = applyMovement(onHand, m, false)
  assert.equal(onHand, 5)
  assert.equal(stockFromLedger(ledger), onHand)
})

test('expected cash in the drawer', () => {
  assert.equal(
    expectedCash({ openingFloat: 5_000, cashFromSales: 40_000, cashRefunds: 966, cashIn: 2_000, cashOut: 10_000 }),
    36_034,
  )
})

test('closing a shift: exact count needs no reason', () => {
  assert.deepEqual(closeShift(36_034, 36_034), { expected: 36_034, counted: 36_034, difference: 0 })
})

test('closing a shift: any difference needs a reason', () => {
  assert.throws(() => closeShift(36_034, 35_000), code('REASON_REQUIRED'))
  assert.equal(closeShift(36_034, 35_000, 'gave wrong change').difference, -1_034)
  assert.equal(closeShift(36_034, 36_100, 'unknown').difference, 66)
})
