import { test } from 'node:test'
import assert from 'node:assert/strict'

import { barcodeSvg, labelsHtml, type LabelData } from './html'

const label = (n: number): LabelData => ({ name: `قميص ${n}`, variantLabel: 'M / Blanc', price: 2500, barcode: '5901234123457' })
const opts = { skip: 0, showPrice: true, currency: 'DA' }

test('roll layouts print one label per page', () => {
  const { html, pages } = labelsHtml([label(1), label(2), label(3)], { ...opts, layout: 'roll-50x30' })
  assert.equal(pages, 3)
  assert.match(html, /@page \{ size: 50mm 30mm/)
  assert.equal(html.match(/class="label"/g)!.length, 3)
})

test('A4 sheets fill a grid and start after skipped labels', () => {
  const { html, pages } = labelsHtml(Array.from({ length: 30 }, (_, i) => label(i)), { ...opts, layout: 'a4-3x8', skip: 5 })
  // 5 skipped + 30 labels = 35 slots → 2 pages of 24.
  assert.equal(pages, 2)
  assert.equal(html.match(/<div class="label"><\/div>/g)!.length, 5, 'empty slots for used labels')
  assert.match(html, /grid-template-columns: repeat\(3, 70mm\)/)
})

test('skip is clamped to the sheet and ignored for rolls', () => {
  // Clamped to 23 (one free slot left on a 24-label sheet): 23 empty + 1 label = one page.
  const clamped = labelsHtml([label(1)], { ...opts, layout: 'a4-3x8', skip: 999 })
  assert.equal(clamped.pages, 1)
  assert.equal(clamped.html.match(/<div class="label"><\/div>/g)!.length, 23)
  assert.equal(labelsHtml([label(1)], { ...opts, layout: 'roll-40x25', skip: 10 }).pages, 1)
})

test('barcode SVG has one rect per bar run (30 for EAN-13) and the digits under it', () => {
  const svg = barcodeSvg('5901234123457', 0.33, 11)
  assert.equal(svg.match(/<rect /g)!.length, 30)
  assert.match(svg, /viewBox="0 0 113 /) // 11 + 95 + 7 modules
  assert.match(svg, /5901234123457/)
})

test('UPC-A prints as EAN-13; other codes print as text only', () => {
  assert.match(barcodeSvg('012345678905', 0.33, 11), /0012345678905/)
  const text = barcodeSvg('SKU-000001', 0.33, 11)
  assert.doesNotMatch(text, /<svg/)
  assert.match(text, /SKU-000001/)
})

test('names and codes are HTML-escaped', () => {
  const { html } = labelsHtml([{ name: '<img src=x onerror=alert(1)>', variantLabel: '"&', price: 1, barcode: '<b>' }], { ...opts, layout: 'roll-50x30' })
  assert.doesNotMatch(html, /<img|<b>/)
  assert.match(html, /&lt;img/)
})

test('price can be hidden', () => {
  assert.doesNotMatch(labelsHtml([label(1)], { ...opts, showPrice: false, layout: 'roll-50x30' }).html, /class="price"/)
})
