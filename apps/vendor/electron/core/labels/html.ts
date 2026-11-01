import { ean13Modules, toEan13 } from '@albaz/pos-core'

import type { LabelLayout } from '../../shared/ipc'

/** Physical layouts (mm). Roll layouts print one label per page; sheets are A4 grids. */
export const LAYOUTS: Record<LabelLayout, {
  label: { w: number; h: number }
  page: { w: number; h: number }
  cols: number
  rows: number
  /** Sheet margins and gaps between labels (mm). */
  margin: { top: number; left: number }
  gap: { x: number; y: number }
  /** Width of one bar module (mm). ≥ 0.26 mm scans reliably at 203 dpi. */
  module: number
}> = {
  'roll-50x30': { label: { w: 50, h: 30 }, page: { w: 50, h: 30 }, cols: 1, rows: 1, margin: { top: 0, left: 0 }, gap: { x: 0, y: 0 }, module: 0.33 },
  'roll-40x25': { label: { w: 40, h: 25 }, page: { w: 40, h: 25 }, cols: 1, rows: 1, margin: { top: 0, left: 0 }, gap: { x: 0, y: 0 }, module: 0.3 },
  // Common A4 sticker sheets: 24 labels (70 × 37 mm) and 65 labels (38.1 × 21.2 mm).
  'a4-3x8': { label: { w: 70, h: 37 }, page: { w: 210, h: 297 }, cols: 3, rows: 8, margin: { top: 0.5, left: 0 }, gap: { x: 0, y: 0 }, module: 0.33 },
  'a4-5x13': { label: { w: 38.1, h: 21.2 }, page: { w: 210, h: 297 }, cols: 5, rows: 13, margin: { top: 10.7, left: 4.7 }, gap: { x: 2.5, y: 0 }, module: 0.26 },
}

export interface LabelData {
  name: string
  variantLabel: string
  price: number
  barcode: string
}

export interface LabelOptions {
  layout: LabelLayout
  /** Labels already used on the first A4 sheet (start further down). */
  skip: number
  showPrice: boolean
  currency: string
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function amount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * EAN-13 as inline SVG: one <rect> per run of bars, sized in mm so the printer
 * driver rasterises at its own resolution. 11/7-module quiet zones left/right.
 * Codes that are not EAN-13/UPC-A are printed as text only.
 */
export function barcodeSvg(code: string, moduleMm: number, heightMm: number): string {
  const ean = toEan13(code)
  if (!ean) return `<div class="code-text">${esc(code)}</div>`
  const modules = ean13Modules(ean)
  const quietLeft = 11
  const total = quietLeft + modules.length + 7
  const rects: string[] = []
  for (let i = 0; i < modules.length; ) {
    if (modules[i] === '1') {
      let j = i
      while (modules[j] === '1') j++
      // Guard bars run longer, as on printed products.
      const guard = i < 3 || (i >= 45 && i < 50) || i >= 92
      rects.push(`<rect x="${quietLeft + i}" y="0" width="${j - i}" height="${guard ? 1.08 : 1}"/>`)
      i = j
    } else i++
  }
  const w = total * moduleMm
  return `<svg class="bars" xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(2)}mm" height="${(heightMm * 1.08).toFixed(2)}mm"
    viewBox="0 0 ${total} 1.08" preserveAspectRatio="none" shape-rendering="crispEdges">${rects.join('')}</svg>
    <div class="digits">${esc(ean)}</div>`
}

/** Full print document: every label in order, laid out on pages for the chosen layout. */
export function labelsHtml(labels: readonly LabelData[], opts: LabelOptions): { html: string; pages: number } {
  const L = LAYOUTS[opts.layout]
  const perPage = L.cols * L.rows
  const skip = perPage > 1 ? Math.min(Math.max(0, opts.skip), perPage - 1) : 0
  const slots: (LabelData | null)[] = [...Array<null>(skip).fill(null), ...labels]
  const pages = Math.max(1, Math.ceil(slots.length / perPage))
  // Everything (name, option, bars, digits, price) must fit the label height:
  // ~19 mm of text and padding on short labels, so the bars get what is left.
  const small = L.label.h < 25
  const barHeight = small ? 6 : L.label.h <= 30 ? 8 : 11

  const cell = (d: LabelData | null) =>
    d === null
      ? '<div class="label"></div>'
      : `<div class="label">
          <div class="name"><bdi>${esc(d.name)}</bdi></div>
          ${d.variantLabel ? `<div class="variant"><bdi>${esc(d.variantLabel)}</bdi></div>` : ''}
          <div class="code">${barcodeSvg(d.barcode, L.module, barHeight)}</div>
          ${opts.showPrice ? `<div class="price"><bdi>${amount(d.price)} ${esc(opts.currency)}</bdi></div>` : ''}
        </div>`

  const body: string[] = []
  for (let p = 0; p < pages; p++) {
    body.push(`<section class="page">${slots.slice(p * perPage, (p + 1) * perPage).map(cell).join('')}</section>`)
  }

  const html = `<!doctype html>
<html dir="auto"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<style>
  @page { size: ${L.page.w}mm ${L.page.h}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: #000; overflow: hidden; }
  ::-webkit-scrollbar { display: none; }
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-weight: 600; }
  .page {
    width: ${L.page.w}mm; height: ${L.page.h}mm; overflow: hidden;
    padding: ${L.margin.top}mm 0 0 ${L.margin.left}mm;
    display: grid; grid-template-columns: repeat(${L.cols}, ${L.label.w}mm); grid-auto-rows: ${L.label.h}mm;
    column-gap: ${L.gap.x}mm; row-gap: ${L.gap.y}mm; align-content: start;
    break-after: page;
  }
  .page:last-child { break-after: auto; }
  .label {
    width: ${L.label.w}mm; height: ${L.label.h}mm; overflow: hidden;
    padding: ${small ? 0.8 : 1.5}mm ${small ? 1 : 2}mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    gap: ${small ? 0.2 : 0.5}mm;
  }
  .name { font-size: ${small ? 6.5 : 8}pt; line-height: 1.15; max-height: 2.3em; overflow: hidden; width: 100%; flex-shrink: 0; }
  .variant { font-size: ${small ? 6 : 7}pt; font-weight: 500; }
  .code { display: flex; flex-direction: column; align-items: center; }
  .bars { display: block; fill: #000; }
  .digits { font-family: Consolas, "Courier New", monospace; font-size: ${small ? 6 : 7}pt; letter-spacing: 0.6pt; direction: ltr; }
  .code-text { font-family: Consolas, "Courier New", monospace; font-size: 8pt; direction: ltr; }
  .price { font-size: ${small ? 8 : L.label.h <= 30 ? 10 : 11}pt; font-weight: 800; line-height: 1.1; }
</style></head><body>${body.join('')}</body></html>`
  return { html, pages }
}
