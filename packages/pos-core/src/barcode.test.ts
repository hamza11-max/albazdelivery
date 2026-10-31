import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ean13CheckDigit, inStoreEan13, isInStoreCode, isValidEan13, normaliseCode } from './index'

test('check digit matches known barcodes', () => {
  assert.equal(ean13CheckDigit('400638133393'), 1) // 4006381333931
  assert.equal(ean13CheckDigit('613000000001'), 5) // 6+3+3+3 = 15 → 5
  assert.ok(isValidEan13('4006381333931'))
  assert.ok(!isValidEan13('4006381333932'))
  assert.ok(!isValidEan13('400638133393'))
  assert.ok(!isValidEan13('40063813339a1'))
})

test('in-store codes are valid, start with 2 and are unique per sequence', () => {
  const a = inStoreEan13(1)
  const b = inStoreEan13(2)
  assert.equal(a, '2000000000015')
  assert.ok(isValidEan13(a) && isInStoreCode(a))
  assert.notEqual(a, b)
  assert.equal(inStoreEan13(123, 7).slice(0, 3), '207')
  assert.ok(!isInStoreCode('4006381333931'))
})

test('in-store code inputs are range-checked', () => {
  assert.throws(() => inStoreEan13(0))
  assert.throws(() => inStoreEan13(1_000_000_000))
  assert.throws(() => inStoreEan13(1, 100))
})

test('normaliseCode trims scanner input and rejects junk', () => {
  assert.equal(normaliseCode('  4006381333931 \n'), '4006381333931')
  assert.equal(normaliseCode('SKU 12'), 'SKU12')
  assert.equal(normaliseCode('   '), null)
  assert.equal(normaliseCode('a\u0007b'), null)
  assert.equal(normaliseCode('x'.repeat(49)), null)
})
