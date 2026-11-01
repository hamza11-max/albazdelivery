import { buildReturn } from '@albaz/pos-core'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { SaleDetail, SaleSummaryRow } from '../../shared/ipc'
import { ApiError, call } from '../api'
import { useAuth } from '../auth'
import { useI18n, type MessageKey } from '../i18n'
import { Modal } from './ShiftPanels'

type Range = 'today' | 'yesterday' | 'week' | 'all'
const PAGE = 100

/** Local-day boundaries as ISO times for the range. */
function bounds(range: Range): { from?: string; to?: string } {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const day = 86_400_000
  if (range === 'today') return { from: startOfToday.toISOString() }
  if (range === 'yesterday') return { from: new Date(startOfToday.getTime() - day).toISOString(), to: startOfToday.toISOString() }
  if (range === 'week') return { from: new Date(startOfToday.getTime() - 6 * day).toISOString() }
  return {}
}

export function History() {
  const { t, money, errorText, lang } = useI18n()
  const [range, setRange] = useState<Range>('today')
  const [number, setNumber] = useState('')
  const [rows, setRows] = useState<SaleSummaryRow[]>([])
  const [total, setTotal] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const time = (iso: string) => new Date(iso).toLocaleString(lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const load = useCallback(
    async (offset = 0) => {
      try {
        const page = await call('sales:history', { ...bounds(number ? 'all' : range), ...(number ? { number } : {}), limit: PAGE, offset })
        setRows((prev) => (offset === 0 ? page.rows : [...prev, ...page.rows]))
        setTotal(page.total)
        setError(null)
      } catch (err) {
        setError(errorText(err))
      }
    },
    [range, number, errorText],
  )

  useEffect(() => {
    const timer = setTimeout(() => void load(0), 200)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="history">
      <div className="toolbar">
        <div className="segmented" role="group">
          {(['today', 'yesterday', 'week', 'all'] as const).map((r) => (
            <button key={r} aria-pressed={range === r && !number} onClick={() => { setRange(r); setNumber('') }}>{t(`history.${r}` as MessageKey)}</button>
          ))}
        </div>
        <input type="search" className="search" placeholder={t('history.search')} aria-label={t('history.search')} value={number} onChange={(e) => setNumber(e.target.value)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {rows.length === 0 ? (
        <p className="empty">{t('history.empty')}</p>
      ) : (
        <>
          <table className="grid">
            <thead><tr><th>{t('history.number')}</th><th>{t('history.time')}</th><th>{t('history.cashier')}</th><th className="num">{t('history.items')}</th><th>{t('history.payment')}</th><th className="num">{t('sell.total')}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} tabIndex={0} onClick={() => setOpenId(r.id)} onKeyDown={(e) => e.key === 'Enter' && setOpenId(r.id)} className={r.status === 'VOIDED' ? 'inactive' : ''}>
                  <td className="mono">
                    <bdi>{r.number}</bdi>
                    {r.type === 'RETURN' && <span className="badge warn"> {t('history.return')}</span>}
                    {r.status === 'VOIDED' && <span className="badge err"> {t('history.voided')}</span>}
                  </td>
                  <td><bdi>{time(r.createdAt)}</bdi></td>
                  <td>{r.cashier}</td>
                  <td className="num">{r.items}</td>
                  <td className="small">{[r.cash ? t('history.cash') : '', r.card ? t('history.card') : ''].filter(Boolean).join(' + ')}</td>
                  <td className="num strong"><bdi>{money(r.total)}</bdi></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length < total && <button className="load-more" onClick={() => void load(rows.length)}>{t('common.loadMore')}</button>}
        </>
      )}
      {openId && <SaleDrawer id={openId} onClose={(changed) => { setOpenId(null); if (changed) void load(0) }} onOpen={setOpenId} />}
    </div>
  )
}

function SaleDrawer({ id, onClose, onOpen }: { id: string; onClose: (changed: boolean) => void; onOpen: (id: string) => void }) {
  const { t, money, errorText, lang } = useI18n()
  const { isOwner } = useAuth()
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [dialog, setDialog] = useState<null | 'void' | 'return'>(null)
  const [changed, setChanged] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const when = (iso: string) => new Date(iso).toLocaleString(lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ')

  const load = useCallback(() => call('sales:detail', { id }).then(setSale, (err) => setMessage({ tone: 'err', text: errorText(err) })), [id, errorText])
  useEffect(() => void load(), [load])

  async function reprint() {
    try {
      const r = await call('sell:printReceipt', { saleId: id })
      setMessage(r.printed ? { tone: 'ok', text: t('sale.printed') } : { tone: 'err', text: t('sale.noPrinter') })
    } catch (err) {
      setMessage({ tone: 'err', text: errorText(err) })
    }
  }

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose(changed)}>
      <section className="drawer narrow" role="dialog" aria-modal="true" aria-labelledby="sale-title">
        <header className="drawer-head">
          <h2 id="sale-title">{sale?.type === 'RETURN' ? t('history.return') : t('history.number')} <bdi className="mono">{sale?.number}</bdi></h2>
          <button className="ghost" onClick={() => onClose(changed)} aria-label={t('common.close')}>✕</button>
        </header>
        {sale && (
          <div className="drawer-body">
            <p className="muted"><bdi>{when(sale.createdAt)}</bdi> · {sale.cashier}</p>
            {sale.originalId && <p>{t('history.of')} <button className="linkish" onClick={() => onOpen(sale.originalId!)}><bdi>{sale.originalNumber}</bdi></button></p>}
            {sale.voided && <p className="error">{t('history.voided')} — {t('history.voidedBy')} {sale.voided.by}: {sale.voided.reason}</p>}
            <table className="grid compact">
              <thead><tr><th>{t('products.colName')}</th><th className="num">{t('sell.qty')}</th><th className="num">{t('sell.price')}</th><th className="num">{t('sell.total')}</th></tr></thead>
              <tbody>
                {sale.lines.map((l) => (
                  <tr key={l.lineId}>
                    <td>{l.name}{l.variant && <div className="muted small"><bdi>{l.variant}</bdi></div>}{l.returnedQty > 0 && <div className="small badge warn">{l.returnedQty} {t('history.returnedQty')}</div>}</td>
                    <td className="num">{Math.abs(l.qty)}</td>
                    <td className="num"><bdi>{money(l.unitPrice)}</bdi></td>
                    <td className="num"><bdi>{money(l.lineTotal)}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="facts z">
              {sale.discountTotal > 0 && <><dt>{t('sell.discount')}</dt><dd><bdi>{money(-sale.discountTotal)}</bdi></dd></>}
              <dt className="strong">{t('sell.total')}</dt><dd className="strong"><bdi>{money(sale.total)}</bdi></dd>
              {sale.payments.map((p, i) => <PaymentRow key={i} method={p.method} amount={p.amount} />)}
              {sale.change > 0 && <><dt>{t('sale.change')}</dt><dd><bdi>{money(sale.change)}</bdi></dd></>}
            </dl>
            {sale.returns.length > 0 && (
              <div>
                <h3>{t('history.returns')}</h3>
                {sale.returns.map((r) => <button key={r.id} className="linkish block" onClick={() => onOpen(r.id)}><bdi>{r.number}</bdi> · <bdi>{money(r.total)}</bdi></button>)}
              </div>
            )}
            {sale.canReturn && <p className="muted small">{t('history.windowEnds')} <bdi>{when(sale.returnWindowEnds)}</bdi></p>}
            {message && <p className={`status ${message.tone}`} role="status">{message.text}</p>}
            <footer className="drawer-foot">
              {sale.canVoid && <button className="danger ghost" onClick={() => setDialog('void')}>{t('history.void')}</button>}
              <span className="spacer" />
              <button onClick={() => void reprint()}>{t('history.reprint')}</button>
              {sale.canReturn && <button className="primary" onClick={() => setDialog('return')}>{t('history.doReturn')}</button>}
            </footer>
          </div>
        )}
      </section>
      {sale && dialog === 'void' && (
        <VoidDialog sale={sale} needsPin={!isOwner} onClose={() => setDialog(null)} onDone={(s) => { setSale(s); setDialog(null); setChanged(true) }} />
      )}
      {sale && dialog === 'return' && (
        <ReturnDialog sale={sale} isOwner={isOwner} onClose={() => setDialog(null)} onDone={(newId) => { setDialog(null); setChanged(true); onOpen(newId) }} />
      )}
    </div>
  )
}

function PaymentRow({ method, amount }: { method: 'CASH' | 'CARD_EXTERNAL'; amount: number }) {
  const { t, money } = useI18n()
  return <><dt>{method === 'CASH' ? t('history.cash') : t('history.card')}</dt><dd><bdi>{money(amount)}</bdi></dd></>
}

function VoidDialog({ sale, needsPin, onClose, onDone }: { sale: SaleDetail; needsPin: boolean; onClose: () => void; onDone: (s: SaleDetail) => void }) {
  const { t, errorText } = useI18n()
  const [reason, setReason] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <Modal title={`${t('history.void')} — ${sale.number}`} onClose={onClose}>
      <form className="fields" onSubmit={(e) => {
        e.preventDefault()
        call('sales:void', { id: sale.id, reason, ...(needsPin ? { ownerPin: pin } : {}) }).then(onDone, (err) => setError(errorText(err)))
      }}>
        <label>{t('history.voidReason')}<input autoFocus required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        {needsPin && <label>{t('pay.ownerPin')}<input required type="password" inputMode="numeric" minLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} /></label>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="buttons"><button type="button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary danger-fill">{t('history.void')}</button></div>
      </form>
    </Modal>
  )
}

function ReturnDialog({ sale, isOwner, onClose, onDone }: { sale: SaleDetail; isOwner: boolean; onClose: () => void; onDone: (returnId: string) => void }) {
  const { t, money, errorText } = useI18n()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [method, setMethod] = useState<'CASH' | 'CARD_EXTERNAL'>(sale.payments.some((p) => p.method === 'CASH') ? 'CASH' : 'CARD_EXTERNAL')
  const late = !isOwner && Date.now() > new Date(sale.returnWindowEnds).getTime()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // One id per return attempt: a retry never records it twice.
  const [returnId] = useState(() => crypto.randomUUID())

  const requests = Object.entries(qty).filter(([, q]) => q > 0).map(([lineId, q]) => ({ lineId, qty: q }))
  // Same rule as main (pos-core): refund what was paid per unit, settled on the last unit.
  const refund = useMemo(() => {
    if (requests.length === 0) return 0
    try {
      return buildReturn(
        sale.lines.map((l) => ({ lineId: l.lineId, variantId: l.variantId, qty: l.qty, net: l.net })),
        new Map(sale.lines.map((l) => [l.lineId, { qty: l.returnedQty, refunded: l.refunded }])),
        requests,
      ).refundTotal
    } catch {
      return null
    }
  }, [JSON.stringify(requests), sale])

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const r = await call('sales:return', { id: returnId, originalSaleId: sale.id, lines: requests, refundMethod: method, ...(late ? { ownerPin: pin } : {}) })
      void call('sell:printReceipt', { saleId: r.saleId }).catch(() => undefined)
      onDone(r.saleId)
    } catch (err) {
      setError(err instanceof ApiError ? errorText(err) : String(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={`${t('return.title')} — ${sale.number}`} onClose={onClose} busy={busy}>
      <p className="muted small">{t('return.help')}</p>
      <table className="grid compact">
        <thead><tr><th>{t('products.colName')}</th><th className="num">{t('sell.qty')}</th><th>{t('return.qty')}</th></tr></thead>
        <tbody>
          {sale.lines.map((l) => {
            const left = l.qty - l.returnedQty
            return (
              <tr key={l.lineId}>
                <td>{l.name}{l.variant && <div className="muted small"><bdi>{l.variant}</bdi></div>}</td>
                <td className="num">{left}</td>
                <td>
                  <input inputMode="numeric" disabled={left <= 0} aria-label={`${t('return.qty')} ${l.name}`} value={qty[l.lineId] ?? ''}
                    onChange={(e) => setQty({ ...qty, [l.lineId]: Math.min(left, Number(e.target.value.replace(/[^\d]/g, '') || 0)) })} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <label className="fields">{t('return.method')}
        <select value={method} onChange={(e) => setMethod(e.target.value as 'CASH' | 'CARD_EXTERNAL')}>
          <option value="CASH">{t('history.cash')}</option>
          <option value="CARD_EXTERNAL">{t('history.card')}</option>
        </select>
      </label>
      {late && <label className="fields">{t('return.ownerPin')}<input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} /></label>}
      <div className="grand-total"><span>{t('return.refund')}</span><bdi>{money(refund ?? 0)}</bdi></div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="buttons">
        <button type="button" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
        <button className="primary" disabled={busy || !refund || (late && pin.length < 4)} onClick={() => void submit()}>{t('return.confirm')}</button>
      </div>
    </Modal>
  )
}
