import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ftsQuery, normaliseSearchText } from './index'

test('Arabic: hamza forms, alef maqsura, ta marbuta, harakat and tatweel are normalised', () => {
  assert.equal(normaliseSearchText('أحمر'), normaliseSearchText('احمر'))
  assert.equal(normaliseSearchText('إطار'), 'اطار')
  assert.equal(normaliseSearchText('مستشفى'), 'مستشفي')
  assert.equal(normaliseSearchText('حقيبة'), 'حقيبه')
  assert.equal(normaliseSearchText('قَمِيصٌ'), 'قميص')
  assert.equal(normaliseSearchText('جـــديد'), 'جديد')
})

test('French: accents and case are ignored', () => {
  assert.equal(normaliseSearchText('Chaussure Élégante'), 'chaussure elegante')
  assert.equal(normaliseSearchText('  Crème   ÉTÉ '), 'creme ete')
})

test('ftsQuery makes every word a quoted prefix', () => {
  assert.equal(ftsQuery('chem bla'), '"chem"* "bla"*')
  assert.equal(ftsQuery('قميص أبيض'), '"قميص"* "ابيض"*')
})

test('ftsQuery neutralises FTS syntax and empty input', () => {
  assert.equal(ftsQuery('a" OR "b'), '"a"* "or"* "b"*')
  assert.equal(ftsQuery('NEAR(x)'), '"near(x)"*')
  assert.equal(ftsQuery('   '), null)
  assert.equal(ftsQuery('"'), null)
})
