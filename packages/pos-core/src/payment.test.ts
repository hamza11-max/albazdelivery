import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PosError, settle } from './index'

const code = (c: string) => (err: unknown) => err instanceof PosError && err.code === c

test('cash with change (sample receipt: 12 500 paid with 15 000)', () => {
  assert.deepEqual(settle(12_500, [{ method: 'CASH', amount: 15_000 }]), {
    paidTotal: 15_000,
    cashTendered: 15_000,
    cardTotal: 0,
    creditTotal: 0,
    change: 2_500,
    cashKept: 12_500,
  })
})

test('exact cash', () => {
  const s = settle(12_500, [{ method: 'CASH', amount: 12_500 }])
  assert.equal(s.change, 0)
  assert.equal(s.cashKept, 12_500)
})

test('split card + cash: change only from cash', () => {
  const s = settle(12_500, [
    { method: 'CARD_EXTERNAL', amount: 10_000 },
    { method: 'CASH', amount: 3_000 },
  ])
  assert.equal(s.change, 500)
  assert.equal(s.cashKept, 2_500)
  assert.equal(s.cardTotal, 10_000)
})

test('credit (on account): part or all of a sale, never more than the total, no change from it', () => {
  const s = settle(12_500, [{ method: 'CREDIT', amount: 10_000 }, { method: 'CASH', amount: 3_000 }])
  assert.deepEqual([s.creditTotal, s.change, s.cashKept], [10_000, 500, 2_500])
  assert.equal(settle(12_500, [{ method: 'CREDIT', amount: 12_500 }]).paidTotal, 12_500)
  assert.throws(() => settle(12_500, [{ method: 'CREDIT', amount: 8_000 }, { method: 'CARD_EXTERNAL', amount: 5_000 }]), code('CARD_OVERPAYMENT'))
})

test('card cannot exceed the total', () => {
  assert.throws(() => settle(12_500, [{ method: 'CARD_EXTERNAL', amount: 13_000 }]), code('CARD_OVERPAYMENT'))
})

test('not enough money', () => {
  assert.throws(() => settle(12_500, [{ method: 'CASH', amount: 12_000 }]), code('INSUFFICIENT_PAYMENT'))
  assert.throws(() => settle(12_500, []), code('INSUFFICIENT_PAYMENT'))
})

test('zero-total sale needs no payment', () => {
  assert.equal(settle(0, []).change, 0)
})

test('rejects zero, negative and fractional tenders', () => {
  assert.throws(() => settle(100, [{ method: 'CASH', amount: 0 }]), code('INVALID_MONEY'))
  assert.throws(() => settle(100, [{ method: 'CASH', amount: -100 }]), code('INVALID_MONEY'))
  assert.throws(() => settle(100, [{ method: 'CASH', amount: 100.5 }]), code('INVALID_MONEY'))
})
