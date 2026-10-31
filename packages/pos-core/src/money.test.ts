import { test } from 'node:test'
import assert from 'node:assert/strict'

import { allocate, assertMoney, assertQuantity, MAX_MONEY, PosError } from './index'

const code = (c: string) => (err: unknown) => err instanceof PosError && err.code === c

test('assertMoney accepts whole non-negative dinars', () => {
  assert.equal(assertMoney(0, 'x'), 0)
  assert.equal(assertMoney(12_500, 'x'), 12_500)
  assert.equal(assertMoney(MAX_MONEY, 'x'), MAX_MONEY)
})

test('assertMoney rejects floats, negatives, NaN and huge values', () => {
  for (const bad of [0.5, 12.99, -1, Number.NaN, Number.POSITIVE_INFINITY, MAX_MONEY + 1]) {
    assert.throws(() => assertMoney(bad, 'x'), code('INVALID_MONEY'), String(bad))
  }
})

test('assertQuantity requires 1..max whole units', () => {
  assert.equal(assertQuantity(1, 'q'), 1)
  for (const bad of [0, -1, 1.5, 10_000]) assert.throws(() => assertQuantity(bad, 'q'), code('INVALID_QUANTITY'))
  assert.equal(assertQuantity(50, 'q', 50), 50)
})

test('allocate splits exactly and in proportion', () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33])
  assert.deepEqual(allocate(500, [5000, 6800, 1200]), [192, 262, 46])
  assert.deepEqual(allocate(0, [10, 20]), [0, 0])
  assert.deepEqual(allocate(7, [0, 0]), [0, 0])
})

test('allocate always sums to the total', () => {
  for (let seed = 1; seed < 200; seed++) {
    const weights = Array.from({ length: (seed % 7) + 1 }, (_, i) => ((seed * 7919 + i * 104729) % 9973) + 1)
    const total = (seed * 131) % 5000
    const parts = allocate(total, weights)
    assert.equal(parts.reduce((s, v) => s + v, 0), total, `seed ${seed}`)
    assert.ok(parts.every((p) => Number.isInteger(p) && p >= 0))
  }
})
