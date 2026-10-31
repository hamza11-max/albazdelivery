import { PAPER_DOTS, type PaperWidth } from './escpos'

export type ReceiptLang = 'ar' | 'fr' | 'mixed'

export interface ReceiptOptions {
  lang: ReceiptLang
  paper: PaperWidth
}

interface Line {
  ar: string
  fr: string
  variant: string
  qty: number
  unitPrice: number
}

/** Fixed sample sale used by the spike. Amounts are whole DZD. */
const SAMPLE = {
  shop: { ar: 'متجر الباز للملابس', fr: 'AL-baz Boutique', phone: '0550 12 34 56', address: { ar: 'شارع العربي بن مهيدي، وهران', fr: 'Rue Larbi Ben M’hidi, Oran' } },
  number: 'R-0001-000123',
  cashier: 'Amina',
  lines: [
    { ar: 'قميص قطن أبيض', fr: 'Chemise coton blanche', variant: 'L / أبيض', qty: 2, unitPrice: 2500 },
    { ar: 'حذاء رياضي', fr: 'Baskets sport', variant: '42', qty: 1, unitPrice: 6800 },
    { ar: 'حزام جلد بني', fr: 'Ceinture cuir marron', variant: '', qty: 1, unitPrice: 1200 },
  ] satisfies Line[],
  discount: 500,
  paid: 15000,
  footer: {
    ar: 'شكراً لزيارتكم! الاستبدال خلال 7 أيام مع الوصل.',
    fr: 'Merci de votre visite ! Échange sous 7 jours avec ce ticket.',
  },
}

const LABELS = {
  ar: { receipt: 'وصل رقم', date: 'التاريخ', cashier: 'البائع', subtotal: 'المجموع الفرعي', discount: 'تخفيض', total: 'المجموع', paid: 'المدفوع نقداً', change: 'الباقي', currency: 'د.ج' },
  fr: { receipt: 'Ticket n°', date: 'Date', cashier: 'Caissier', subtotal: 'Sous-total', discount: 'Remise', total: 'TOTAL', paid: 'Espèces', change: 'Rendu', currency: 'DA' },
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

function label(lang: ReceiptLang, key: keyof typeof LABELS.ar): string {
  if (lang === 'mixed') return `${LABELS.ar[key]} <bdi>/ ${LABELS.fr[key]}</bdi>`
  return LABELS[lang][key]
}

function money(lang: ReceiptLang, n: number): string {
  const cur = lang === 'fr' ? LABELS.fr.currency : LABELS.ar.currency
  // The number gets its own LTR run so a minus sign stays on its left in Arabic receipts.
  return `<bdi><span dir="ltr">${n < 0 ? '−' : ''}${amount(Math.abs(n))}</span> ${cur}</bdi>`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function receiptTotals() {
  const subtotal = SAMPLE.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const total = subtotal - SAMPLE.discount
  return { subtotal, total, change: SAMPLE.paid - total }
}

export function receiptHtml({ lang, paper }: ReceiptOptions, now = new Date()): string {
  const width = PAPER_DOTS[paper]
  const base = paper === 80 ? 22 : 16
  const dir = lang === 'fr' ? 'ltr' : 'rtl'
  const { subtotal, total, change } = receiptTotals()
  const date = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`

  const shopName =
    lang === 'fr' ? esc(SAMPLE.shop.fr)
    : lang === 'ar' ? esc(SAMPLE.shop.ar)
    : `${esc(SAMPLE.shop.ar)}<br><bdi>${esc(SAMPLE.shop.fr)}</bdi>`
  const address = lang === 'fr' ? SAMPLE.shop.address.fr : SAMPLE.shop.address.ar

  const items = SAMPLE.lines
    .map((l) => {
      const name =
        lang === 'fr' ? esc(l.fr)
        : lang === 'ar' ? esc(l.ar)
        : `${esc(l.ar)}<div class="sub"><bdi>${esc(l.fr)}</bdi></div>`
      const variant = l.variant ? `<div class="sub"><bdi>${esc(l.variant)}</bdi></div>` : ''
      return `<div class="item">
        <div class="name">${name}${variant}</div>
        <div class="qty"><bdi>${l.qty} × ${amount(l.unitPrice)}</bdi></div>
        <div class="amt">${money(lang, l.qty * l.unitPrice)}</div>
      </div>`
    })
    .join('')

  const footer =
    lang === 'fr' ? esc(SAMPLE.footer.fr)
    : lang === 'ar' ? esc(SAMPLE.footer.ar)
    : `${esc(SAMPLE.footer.ar)}<br><bdi>${esc(SAMPLE.footer.fr)}</bdi>`

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
  .center { text-align: center; }
  .shop { font-size: ${Math.round(base * 1.45)}px; font-weight: 800; line-height: 1.25; }
  .muted { font-size: ${Math.round(base * 0.85)}px; }
  hr { border: 0; border-top: 2px dashed #000; margin: ${Math.round(base * 0.45)}px 0; }
  .meta, .row { display: flex; justify-content: space-between; gap: 8px; }
  .item { display: grid; grid-template-columns: 1fr auto; column-gap: 8px; padding: ${Math.round(base * 0.2)}px 0; }
  .item .name { grid-column: 1 / -1; }
  .item .qty { font-size: ${Math.round(base * 0.9)}px; }
  .item .amt { text-align: end; }
  .sub { font-size: ${Math.round(base * 0.8)}px; font-weight: 500; }
  .total { font-size: ${Math.round(base * 1.4)}px; font-weight: 800; }
  .number { font-family: Consolas, "Courier New", monospace; font-size: ${Math.round(base * 1.2)}px; letter-spacing: 2px; }
</style>
</head>
<body>
  <div class="center shop">${shopName}</div>
  <div class="center muted">${esc(address)}<br><bdi>${esc(SAMPLE.shop.phone)}</bdi></div>
  <hr>
  <div class="meta"><span>${label(lang, 'receipt')}</span><bdi>${esc(SAMPLE.number)}</bdi></div>
  <div class="meta"><span>${label(lang, 'date')}</span><bdi>${date}</bdi></div>
  <div class="meta"><span>${label(lang, 'cashier')}</span><bdi>${esc(SAMPLE.cashier)}</bdi></div>
  <hr>
  ${items}
  <hr>
  <div class="row"><span>${label(lang, 'subtotal')}</span>${money(lang, subtotal)}</div>
  <div class="row"><span>${label(lang, 'discount')}</span>${money(lang, -SAMPLE.discount)}</div>
  <div class="row total"><span>${label(lang, 'total')}</span>${money(lang, total)}</div>
  <div class="row"><span>${label(lang, 'paid')}</span>${money(lang, SAMPLE.paid)}</div>
  <div class="row"><span>${label(lang, 'change')}</span>${money(lang, change)}</div>
  <hr>
  <div class="center muted">${footer}</div>
  <div class="center number">${esc(SAMPLE.number)}</div>
</body>
</html>`
}
