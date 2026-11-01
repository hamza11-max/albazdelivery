import type { ReceiptData } from '../../shared/ipc'
import { PAPER_DOTS, type PaperWidth } from './escpos'

export type { ReceiptData }

export type ReceiptLang = 'ar' | 'fr' | 'mixed'

export interface ReceiptOptions {
  lang: ReceiptLang
  paper: PaperWidth
}

/** Sample sale for the printer test and --selftest (same as the Phase 2 spike). */
export const SAMPLE_RECEIPT: ReceiptData = {
  kind: 'SALE',
  originalNumber: '',
  shop: {
    name: 'متجر الباز للملابس — AL-baz Boutique',
    phone: '0550 12 34 56',
    address: 'شارع العربي بن مهيدي، وهران',
    footer: 'شكراً لزيارتكم! الاستبدال خلال 7 أيام مع الوصل.\nMerci de votre visite ! Échange sous 7 jours avec ce ticket.',
  },
  number: 'R-0001-000123',
  createdAt: '2026-10-31T12:00:00.000Z',
  cashier: 'Amina',
  lines: [
    { name: 'قميص قطن أبيض', nameAlt: 'Chemise coton blanche', variant: 'L / أبيض', qty: 2, unitPrice: 2500, lineDiscount: 0, lineTotal: 5000 },
    { name: 'حذاء رياضي', nameAlt: 'Baskets sport', variant: '42', qty: 1, unitPrice: 6800, lineDiscount: 0, lineTotal: 6800 },
    { name: 'حزام جلد بني', nameAlt: 'Ceinture cuir marron', variant: '', qty: 1, unitPrice: 1200, lineDiscount: 0, lineTotal: 1200 },
  ],
  subtotal: 13000,
  discountTotal: 500,
  total: 12500,
  cashTendered: 15000,
  card: 0,
  credit: 0,
  customer: '',
  change: 2500,
}

const LABELS = {
  ar: { ret: 'وصل إرجاع', original: 'الوصل الأصلي', refund: 'المبلغ المُرجَع', receipt: 'رقم الوصل', date: 'التاريخ', cashier: 'البائع', customer: 'الزبون', subtotal: 'المجموع الفرعي', discount: 'التخفيض', total: 'المجموع', paid: 'نقداً', card: 'بالبطاقة', credit: 'بالدَّين', creditBack: 'إلى حساب الزبون', change: 'الباقي', currency: 'د.ج' },
  fr: { ret: 'RETOUR', original: 'Ticket d’origine', refund: 'Remboursé', receipt: 'Ticket n°', date: 'Date', cashier: 'Caissier', customer: 'Client', subtotal: 'Sous-total', discount: 'Remise', total: 'TOTAL', paid: 'Espèces', card: 'Carte', credit: 'À crédit', creditBack: 'Sur le compte client', change: 'Rendu', currency: 'DA' },
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/**
 * 12500 -> "12 500" with Western digits and a no-break space. (A narrow
 * no-break space is too thin to see on thermal paper, e.g. "1200".)
 */
function amount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * In both languages: "المجموع / TOTAL". The slash sits in the Arabic (RTL) run so it lands between
 * the two words; the French word is isolated so its own punctuation stays with it.
 */
function label(lang: ReceiptLang, key: keyof typeof LABELS.ar): string {
  if (lang === 'mixed') return `${LABELS.ar[key]} / <bdi dir="ltr">${LABELS.fr[key]}</bdi>`
  return LABELS[lang][key]
}

/**
 * Free text from the shop (name, address, footer) can mix Arabic and French. Each line, and each
 * part around " — ", gets its own direction from its first letter, so neither language is reordered.
 */
function lines(text: string, cls: string): string {
  return text
    .split(/\n| — /)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `<div class="${cls}" dir="auto">${esc(t)}</div>`)
    .join('')
}

function money(lang: ReceiptLang, n: number): string {
  const cur = lang === 'fr' ? LABELS.fr.currency : LABELS.ar.currency
  // The number gets its own LTR run so a minus sign stays on its left in Arabic receipts.
  return `<bdi><span dir="ltr">${n < 0 ? '−' : ''}${amount(Math.abs(n))}</span> ${cur}</bdi>`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function localDate(iso: string): string {
  const d = new Date(iso)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Product name in the receipt's language: French uses the other-language name when there is one. */
function itemName(lang: ReceiptLang, l: ReceiptData['lines'][number]): string {
  if (lang === 'fr') return `<span dir="auto">${esc(l.nameAlt || l.name)}</span>`
  if (lang === 'ar' || !l.nameAlt) return `<span dir="auto">${esc(l.name)}</span>`
  return `<div dir="auto">${esc(l.name)}</div><div class="sub" dir="auto">${esc(l.nameAlt)}</div>`
}

export function receiptHtml(data: ReceiptData, { lang, paper }: ReceiptOptions): string {
  const width = PAPER_DOTS[paper]
  const base = paper === 80 ? 22 : 16
  const dir = lang === 'fr' ? 'ltr' : 'rtl'

  const items = data.lines
    .map((l) => {
      const variant = l.variant ? `<div class="sub" dir="auto">${esc(l.variant)}</div>` : ''
      const disc = l.lineDiscount > 0 ? `<div class="sub"><bdi>${label(lang, 'discount')} ${money(lang, -l.lineDiscount)}</bdi></div>` : ''
      return `<div class="item">
        <div class="name">${itemName(lang, l)}${variant}${disc}</div>
        <div class="qty"><bdi>${l.qty} × ${amount(l.unitPrice)}</bdi></div>
        <div class="amt">${money(lang, l.lineTotal)}</div>
      </div>`
    })
    .join('')

  const lineDiscounts = data.lines.reduce((s, l) => s + l.lineDiscount, 0)
  const saleDiscount = data.discountTotal - lineDiscounts
  const row = (key: keyof typeof LABELS.ar, value: string, cls = 'row') => `<div class="${cls}"><span>${label(lang, key)}</span>${value}</div>`

  return `<!doctype html>
<html lang="${lang === 'fr' ? 'fr' : 'ar'}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  /* No scrollbars: one would steal width and, in RTL, push content off the left edge. */
  html, body { width: ${width}px; background: #fff; color: #000; overflow: hidden; }
  ::-webkit-scrollbar { display: none; }
  body {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    font-size: ${base}px; font-weight: 600; line-height: 1.35;
    padding: ${Math.round(base * 0.5)}px ${Math.round(base * 0.4)}px ${base}px;
    -webkit-font-smoothing: none;
  }
  .center, .center[dir] { text-align: center; }
  .shop { font-size: ${Math.round(base * 1.45)}px; font-weight: 800; line-height: 1.25; }
  .muted { font-size: ${Math.round(base * 0.85)}px; }
  hr { border: 0; border-top: 2px dashed #000; margin: ${Math.round(base * 0.45)}px 0; }
  .meta, .row { display: flex; justify-content: space-between; gap: 8px; }
  .item { display: grid; grid-template-columns: 1fr auto; column-gap: 8px; padding: ${Math.round(base * 0.2)}px 0; }
  .item .name { grid-column: 1 / -1; }
  /* A French name or variant keeps its own word order but lines up with the Arabic one above it. */
  ${dir === 'rtl' ? '.item .name [dir] { text-align: right; }' : ''}
  .item .qty { font-size: ${Math.round(base * 0.9)}px; }
  .item .amt { text-align: end; }
  .sub { font-size: ${Math.round(base * 0.8)}px; font-weight: 500; }
  .total { font-size: ${Math.round(base * 1.4)}px; font-weight: 800; }
  .number { font-family: Consolas, "Courier New", monospace; font-size: ${Math.round(base * 1.2)}px; letter-spacing: 2px; }
</style>
</head>
<body>
  ${lines(data.shop.name, 'center shop')}
  ${lines(data.shop.address, 'center muted')}
  ${data.shop.phone ? `<div class="center muted" dir="ltr">${esc(data.shop.phone)}</div>` : ''}
  <hr>
  ${data.kind === 'RETURN' ? `<div class="center shop">${label(lang, 'ret')}</div><div class="meta"><span>${label(lang, 'original')}</span><bdi>${esc(data.originalNumber)}</bdi></div>` : ''}
  <div class="meta"><span>${label(lang, 'receipt')}</span><bdi>${esc(data.number)}</bdi></div>
  <div class="meta"><span>${label(lang, 'date')}</span><bdi>${localDate(data.createdAt)}</bdi></div>
  <div class="meta"><span>${label(lang, 'cashier')}</span><bdi>${esc(data.cashier)}</bdi></div>
  ${data.customer ? `<div class="meta"><span>${label(lang, 'customer')}</span><bdi>${esc(data.customer)}</bdi></div>` : ''}
  <hr>
  ${items}
  <hr>
  ${data.discountTotal > 0 ? row('subtotal', money(lang, data.subtotal)) : ''}
  ${saleDiscount > 0 ? row('discount', money(lang, -saleDiscount)) : ''}
  ${row(data.kind === 'RETURN' ? 'refund' : 'total', money(lang, data.kind === 'RETURN' ? -data.total : data.total), 'row total')}
  ${data.cashTendered > 0 ? row('paid', money(lang, data.cashTendered)) : ''}
  ${data.card > 0 ? row('card', money(lang, data.card)) : ''}
  ${data.credit > 0 ? row(data.kind === 'RETURN' ? 'creditBack' : 'credit', money(lang, data.credit)) : ''}
  ${data.change > 0 ? row('change', money(lang, data.change)) : ''}
  <hr>
  ${lines(data.shop.footer, 'center muted')}
  <div class="center number">${esc(data.number)}</div>
</body>
</html>`
}
