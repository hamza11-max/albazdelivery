import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ean13CheckDigit, ean13Modules, inStoreEan13, isInStoreCode, isValidEan13, normaliseCode, toEan13 } from './index'

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

test('EAN-13 bars match the published encoding of 5901234123457', () => {
  // First digit 5 → parity LGGLLG. Left 901234, right 123457.
  const expected =
    '101' +
    '0001011' + '0100111' + '0110011' + '0010011' + '0111101' + '0011101' + // 9L 0G 1G 2L 3L 4G
    '01010' +
    '1100110' + '1101100' + '1000010' + '1011100' + '1001110' + '1000100' + // R: 1 2 3 4 5 7
    '101'
  assert.equal(ean13Modules('5901234123457'), expected)
})

test('EAN-13 bars: 95 modules, guards in place, every digit is 2 bars and 2 spaces wide 7', () => {
  for (const code of ['4006381333931', '6130000000015', inStoreEan13(42), '0012345678905']) {
    const m = ean13Modules(code)
    assert.equal(m.length, 95)
    assert.equal(m.slice(0, 3), '101')
    assert.equal(m.slice(45, 50), '01010')
    assert.equal(m.slice(92), '101')
    for (const start of [3, 10, 17, 24, 31, 38, 50, 57, 64, 71, 78, 85]) {
      const digit = m.slice(start, start + 7)
      const runs = digit.match(/0+|1+/g)!
      assert.equal(runs.length, 4, `${code} @${start}: ${digit}`)
    }
  }
  assert.throws(() => ean13Modules('5901234123458'))
})

test('toEan13 accepts EAN-13 and UPC-A, refuses everything else', () => {
  assert.equal(toEan13('5901234123457'), '5901234123457')
  assert.equal(toEan13('012345678905'), '0012345678905') // UPC-A
  assert.equal(toEan13('5901234123458'), null)
  assert.equal(toEan13('SKU-000001'), null)
  assert.equal(toEan13('12345678'), null) // EAN-8 not supported yet
})
