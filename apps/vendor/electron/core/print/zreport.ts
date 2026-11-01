import type { ShiftClosed } from '../../shared/ipc'
import { PAPER_DOTS, type PaperWidth } from './escpos'
import type { ReceiptLang } from './receipt'

const L = {
  ar: { title: 'تقرير إغلاق الصندوق', opened: 'الفتح', closed: 'الإغلاق', float: 'رصيد البداية', sales: 'المبيعات', returns: 'المرتجعات', voids: 'الملغاة', cashSales: 'نقداً من المبيعات', refunds: 'مسترجع نقداً', card: 'بطاقة', cashIn: 'إدخال نقود', cashOut: 'إخراج نقود', expected: 'المتوقع في الدرج', counted: 'المعدود', difference: 'الفرق', reason: 'السبب', open: 'مفتوح', currency: 'د.ج' },
  fr: { title: 'Rapport de clôture (Z)', opened: 'Ouverture', closed: 'Clôture', float: 'Fond de caisse', sales: 'Ventes', returns: 'Retours', voids: 'Annulées', cashSales: 'Espèces des ventes', refunds: 'Remboursé en espèces', card: 'Carte', cashIn: 'Entrées', cashOut: 'Sorties', expected: 'Attendu dans le tiroir', counted: 'Compté', difference: 'Écart', reason: 'Motif', open: 'ouvert', currency: 'DA' },
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const when = (iso: string) => {
  const d = new Date(iso)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** End-of-shift report on receipt paper. */
export function zReportHtml(z: ShiftClosed, shopName: string, { lang, paper }: { lang: ReceiptLang; paper: PaperWidth }): string {
  const width = PAPER_DOTS[paper]
  const base = paper === 80 ? 22 : 16
  const dir = lang === 'fr' ? 'ltr' : 'rtl'
  const label = (k: keyof typeof L.ar) => (lang === 'mixed' ? `${L.ar[k]} <bdi>/ ${L.fr[k]}</bdi>` : L[lang][k])
  const cur = lang === 'fr' ? L.fr.currency : L.ar.currency
  const money = (n: number) => `<bdi><span dir="ltr">${n < 0 ? '−' : ''}${String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span> ${cur}</bdi>`
  const row = (k: keyof typeof L.ar, v: string, cls = 'row') => `<div class="${cls}"><span>${label(k)}</span>${v}</div>`

  return `<!doctype html>
<html lang="${lang === 'fr' ? 'fr' : 'ar'}" dir="${dir}">
<head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${width}px; background: #fff; color: #000; overflow: hidden; }
  ::-webkit-scrollbar { display: none; }
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: ${base}px; font-weight: 600; line-height: 1.4; padding: ${base / 2}px ${Math.round(base * 0.4)}px ${base}px; }
  .center { text-align: center; }
  .big { font-size: ${Math.round(base * 1.3)}px; font-weight: 800; }
  hr { border: 0; border-top: 2px dashed #000; margin: ${Math.round(base * 0.45)}px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .strong { font-weight: 800; font-size: ${Math.round(base * 1.15)}px; }
</style></head>
<body>
  <div class="center big">${esc(shopName)}</div>
  <div class="center big">${label('title')}</div>
  <hr>
  ${row('opened', `<bdi>${when(z.openedAt)} · ${esc(z.openedBy)}</bdi>`)}
  ${row('closed', `<bdi>${z.closedAt ? `${when(z.closedAt)} · ${esc(z.closedBy)}` : label('open')}</bdi>`)}
  <hr>
  ${row('sales', `<bdi>${z.salesCount} · ${money(z.salesTotal)}</bdi>`)}
  ${row('returns', `<bdi>${z.returnsCount} · ${money(-z.returnsTotal)}</bdi>`)}
  ${row('voids', `<bdi>${z.voidsCount} · ${money(z.voidsTotal)}</bdi>`)}
  ${row('card', money(z.cardTotal))}
  <hr>
  ${row('float', money(z.openingFloat))}
  ${row('cashSales', money(z.cashFromSales))}
  ${row('refunds', money(-z.cashRefunds))}
  ${row('cashIn', money(z.cashIn))}
  ${row('cashOut', money(-z.cashOut))}
  ${row('expected', money(z.expectedCash), 'row strong')}
  ${z.closedAt ? row('counted', money(z.countedCash), 'row strong') : ''}
  ${z.closedAt ? row('difference', money(z.difference), 'row strong') : ''}
  ${z.differenceReason ? row('reason', `<bdi>${esc(z.differenceReason)}</bdi>`) : ''}
</body></html>`
}
