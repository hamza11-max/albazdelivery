import { computeTotals } from '@albaz/pos-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { HeldCart, ProductSummary, SaleResult, ShiftStatus, VariantInfo } from '../../shared/ipc'
import { ApiError, call } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { CashDialog, CloseShiftDialog, Modal, OpenShift } from './ShiftPanels'

interface Line extends VariantInfo {
  key: string
  qty: number
  lineDiscount: number
}

const digits = (s: string) => s.replace(/[^\d]/g, '').slice(0, 10)
const newId = () => crypto.randomUUID()
let lineSeq = 0

export function Sell() {
  const { t, money, errorText, lang } = useI18n()
  /** HH:MM in the app's language, Western digits. */
  const time = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ', { hour: '2-digit', minute: '2-digit' })
  const { session } = useAuth()
  const [shift, setShift] = useState<ShiftStatus | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [saleDiscount, setSaleDiscount] = useState('')
  const [scan, setScan] = useState('')
  const [results, setResults] = useState<ProductSummary[] | null>(null)
  const [picker, setPicker] = useState<VariantInfo[] | null>(null)
  const [paying, setPaying] = useState(false)
  const [dialog, setDialog] = useState<null | 'IN' | 'OUT' | 'close' | 'held'>(null)
  const [last, setLast] = useState<SaleResult | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  const refreshShift = useCallback(() => call('shift:status').then(setShift, (err) => setMessage({ tone: 'err', text: errorText(err) })), [errorText])
  useEffect(() => void refreshShift(), [refreshShift])
  const focusScan = () => setTimeout(() => scanRef.current?.focus(), 0)

  // Display totals with the same rules main applies (main prices the sale again from the database).
  const totals = useMemo(() => {
    if (lines.length === 0) return null
    try {
      return computeTotals({
        lines: lines.map((l) => ({ variantId: l.variantId, unitPrice: l.price, unitCost: 0, qty: l.qty, lineDiscount: l.lineDiscount })),
        saleDiscount: Number(saleDiscount || 0),
      })
    } catch (err) {
      return { error: (err as Error & { code?: string }).code ?? 'INVALID' }
    }
  }, [lines, saleDiscount])
  const total = totals && 'total' in totals ? totals.total : null

  function addVariant(v: VariantInfo) {
    setLines((ls) => {
      const same = ls.find((l) => l.variantId === v.variantId && l.lineDiscount === 0)
      if (same) return ls.map((l) => (l === same ? { ...l, qty: l.qty + 1 } : l))
      return [...ls, { ...v, key: `l${++lineSeq}`, qty: 1, lineDiscount: 0 }]
    })
    setScan('')
    setResults(null)
    setPicker(null)
    setLast(null)
    focusScan()
  }

  async function pickProduct(productId: string) {
    const p = await call('catalog:product', { id: productId })
    const infos = await call('catalog:variantInfo', { variantIds: p.variants.map((v) => v.id) })
    if (infos.length === 1) addVariant(infos[0]!)
    else setPicker(infos)
  }

  async function onScan() {
    const text = scan.trim()
    if (!text) return
    setMessage(null)
    try {
      const hit = await call('catalog:findByCode', { code: text })
      if (hit) {
        const [info] = await call('catalog:variantInfo', { variantIds: [hit.variantId] })
        if (info) return addVariant(info)
      }
      const found = await call('catalog:products', { query: text, limit: 12 })
      if (found.rows.length === 1) return void pickProduct(found.rows[0]!.id)
      setResults(found.rows)
    } catch (err) {
      setMessage({ tone: 'err', text: errorText(err) })
    }
  }

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key))
  const clearCart = () => {
    setLines([])
    setSaleDiscount('')
    focusScan()
  }
  const cartInput = () => ({ lines: lines.map((l) => ({ variantId: l.variantId, qty: l.qty, lineDiscount: l.lineDiscount })), saleDiscount: Number(saleDiscount || 0) })

  async function hold() {
    if (lines.length === 0) return
    const note = window.prompt(t('sell.heldNote')) ?? ''
    await call('sell:hold', { cart: { ...cartInput(), note } })
    clearCart()
  }

  async function recall(h: HeldCart) {
    const taken = await call('sell:recall', { id: h.id })
    const infos = await call('catalog:variantInfo', { variantIds: taken.cart.lines.map((l) => l.variantId) })
    const byId = new Map(infos.map((i) => [i.variantId, i]))
    setLines(taken.cart.lines.flatMap((l) => {
      const info = byId.get(l.variantId)
      return info ? [{ ...info, key: `l${++lineSeq}`, qty: l.qty, lineDiscount: l.lineDiscount }] : []
    }))
    setSaleDiscount(taken.cart.saleDiscount ? String(taken.cart.saleDiscount) : '')
    setDialog(null)
    focusScan()
  }

  async function onSold(result: SaleResult) {
    setPaying(false)
    setLast(result)
    clearCart()
    void refreshShift()
    const settings = await call('settings:sales')
    if (settings.receipt.autoPrint) void printReceipt(result.saleId)
  }

  async function printReceipt(saleId: string) {
    try {
      const r = await call('sell:printReceipt', { saleId })
      setMessage(r.printed ? { tone: 'ok', text: t('sale.printed') } : { tone: 'err', text: t('sale.noPrinter') })
    } catch (err) {
      // The sale is already saved: a printer problem never undoes it.
      setMessage({ tone: 'err', text: errorText(err) })
    }
  }

  // F12 pays, F8 holds; the scan field keeps focus otherwise.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F12' && total !== null && !paying && !dialog) {
        e.preventDefault()
        setPaying(true)
      } else if (e.key === 'F8' && !paying && !dialog) {
        e.preventDefault()
        void hold()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!shift) return null
  if (!shift.open) return <OpenShift onOpened={(s) => { setShift(s); focusScan() }} />

  return (
    <div className="sell">
      <div className="shift-bar">
        <span className="muted small">
          {t('shift.since')} {time(shift.openedAt)} {t('shift.by')} {shift.openedBy}
          {' · '}{shift.salesCount} {t('shift.sales')} · <bdi>{money(shift.salesTotal)}</bdi>
          {shift.expectedCash !== null && <> · {t('shift.expected')}: <bdi>{money(shift.expectedCash)}</bdi></>}
        </span>
        <span className="spacer" />
        <button className="small" onClick={() => setDialog('IN')}>{t('shift.cashIn')}</button>
        <button className="small" onClick={() => setDialog('OUT')}>{t('shift.cashOut')}</button>
        <button className="small" onClick={() => setDialog('close')} disabled={lines.length > 0}>{t('shift.close')}</button>
      </div>

      <div className="sell-main">
        <section className="cart">
          <form className="scan" onSubmit={(e) => { e.preventDefault(); void onScan() }}>
            <input ref={scanRef} autoFocus className="search" placeholder={t('sell.scan')} aria-label={t('sell.scan')} value={scan}
              onChange={(e) => { setScan(e.target.value); setResults(null) }} />
          </form>

          {results && (
            <div className="results" role="listbox">
              {results.length === 0 && <p className="muted">{t('sell.notFound')}</p>}
              {results.map((p) => (
                <button key={p.id} role="option" aria-selected={false} className="result" onClick={() => void pickProduct(p.id)}>
                  <span className="strong">{p.name}</span>
                  {p.nameAlt && <span className="muted small"><bdi>{p.nameAlt}</bdi></span>}
                  <span className="spacer" />
                  <bdi>{money(p.minPrice)}</bdi>
                </button>
              ))}
            </div>
          )}

          {lines.length === 0 ? (
            <p className="empty">{t('sell.empty')}</p>
          ) : (
            <table className="grid compact cart-lines">
              <thead><tr><th>{t('products.colName')}</th><th className="num">{t('sell.price')}</th><th>{t('sell.qty')}</th><th>{t('sell.discount')}</th><th className="num">{t('sell.total')}</th><th /></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key}>
                    <td><div className="strong">{l.name}</div>{l.variantLabel && <div className="muted small"><bdi>{l.variantLabel}</bdi></div>}</td>
                    <td className="num"><bdi>{money(l.price)}</bdi></td>
                    <td>
                      <span className="qty" dir="ltr">
                        <button className="small" aria-label="−" onClick={() => (l.qty > 1 ? setLine(l.key, { qty: l.qty - 1 }) : removeLine(l.key))}>−</button>
                        <input inputMode="numeric" aria-label={t('sell.qty')} value={l.qty} onChange={(e) => setLine(l.key, { qty: Math.max(1, Number(digits(e.target.value) || 1)) })} />
                        <button className="small" aria-label="+" onClick={() => setLine(l.key, { qty: l.qty + 1 })}>+</button>
                      </span>
                    </td>
                    <td><input className="disc" inputMode="numeric" aria-label={t('sell.discount')} value={l.lineDiscount || ''} onChange={(e) => setLine(l.key, { lineDiscount: Number(digits(e.target.value) || 0) })} /></td>
                    <td className="num"><bdi>{money(l.qty * l.price - l.lineDiscount)}</bdi></td>
                    <td><button className="ghost small" aria-label={t('common.remove')} onClick={() => removeLine(l.key)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="totals card">
          <label className="fields">{t('sell.saleDiscount')}<input inputMode="numeric" value={saleDiscount} onChange={(e) => setSaleDiscount(digits(e.target.value))} /></label>
          {totals && 'total' in totals && (
            <dl className="facts">
              <dt>{t('sell.subtotal')}</dt><dd><bdi>{money(totals.subtotal)}</bdi></dd>
              {totals.discountTotal > 0 && <><dt>{t('sell.discount')}</dt><dd><bdi>{money(-totals.discountTotal)}</bdi></dd></>}
            </dl>
          )}
          {totals && 'error' in totals && <p className="error">{errorText({ code: totals.error, message: '' })}</p>}
          <div className="grand-total"><span>{t('sell.total')}</span><bdi>{money(total ?? 0)}</bdi></div>
          <button className="primary big" disabled={total === null} onClick={() => setPaying(true)}>{t('sell.pay')} (F12)</button>
          <div className="buttons">
            <button disabled={lines.length === 0} onClick={() => void hold()}>{t('sell.hold')} (F8)</button>
            <button onClick={() => setDialog('held')}>{t('sell.recall')}</button>
            <button className="ghost" disabled={lines.length === 0} onClick={clearCart}>{t('sell.clear')}</button>
          </div>
          {last && (
            <div className="sold" role="status">
              <p className="strong">{t('sale.done')} <bdi>{last.number}</bdi></p>
              <p className="change">{t('sale.change')}: <bdi>{money(last.change)}</bdi></p>
              <button onClick={() => void printReceipt(last.saleId)}>{t('sale.printReceipt')}</button>
            </div>
          )}
          {message && <p className={`status ${message.tone}`} role="status">{message.text}</p>}
        </aside>
      </div>

      {picker && (
        <Modal title={picker[0]?.name ?? ''} onClose={() => { setPicker(null); focusScan() }}>
          <div className="variant-picker">
            {picker.map((v) => (
              <button key={v.variantId} className="big" onClick={() => addVariant(v)}>
                <span className="strong"><bdi>{v.variantLabel || v.name}</bdi></span>
                <span className="muted small"><bdi>{money(v.price)}</bdi> · {t('sell.stock')} {v.stockQty}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {paying && total !== null && (
        <PayDialog total={total} cart={cartInput()} isCashier={session.role === 'CASHIER'} onPaid={(r) => void onSold(r)} onClose={() => { setPaying(false); focusScan() }} />
      )}
      {(dialog === 'IN' || dialog === 'OUT') && <CashDialog type={dialog} onDone={(s) => { setShift(s); setDialog(null); focusScan() }} onClose={() => { setDialog(null); focusScan() }} />}
      {dialog === 'close' && <CloseShiftDialog onClose={() => setDialog(null)} onClosed={() => { setDialog(null); setLast(null); void refreshShift() }} />}
      {dialog === 'held' && <HeldDialog onRecall={(h) => void recall(h)} onClose={() => { setDialog(null); focusScan() }} />}
    </div>
  )
}

function PayDialog(props: {
  total: number
  cart: { lines: { variantId: string; qty: number; lineDiscount: number }[]; saleDiscount: number }
  isCashier: boolean
  onPaid: (r: SaleResult) => void
  onClose: () => void
}) {
  const { t, money, errorText } = useI18n()
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [ownerPin, setOwnerPin] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // One id per payment attempt: retrying after an error can never record the sale twice.
  const [saleId] = useState(newId)

  const cashN = Number(cash || 0)
  const cardN = Number(card || 0)
  const paid = cashN + cardN
  const change = paid - props.total
  // Next round amounts a customer is likely to hand over.
  const quick = [...new Set([props.total, ...[500, 1000, 2000, 5000].map((s) => Math.ceil(props.total / s) * s)])].filter((v) => v >= props.total).slice(0, 4)

  async function complete() {
    setBusy(true)
    setError(null)
    const tenders = [
      ...(cashN > 0 ? [{ method: 'CASH' as const, amount: cashN }] : []),
      ...(cardN > 0 ? [{ method: 'CARD_EXTERNAL' as const, amount: cardN }] : []),
    ]
    try {
      props.onPaid(await call('sell:complete', { id: saleId, ...props.cart, tenders, ...(ownerPin ? { ownerPin } : {}) }))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DISCOUNT_NEEDS_OWNER' && ownerPin === null) setOwnerPin('')
      else setError(err instanceof ApiError && err.code === 'OUT_OF_STOCK' ? `${errorText({ code: err.code, message: '' })} ${err.message}` : errorText(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={t('pay.title')} onClose={props.onClose} busy={busy}>
      <form className="pay" onSubmit={(e) => { e.preventDefault(); void complete() }}>
        <div className="grand-total"><span>{t('pay.due')}</span><bdi>{money(props.total)}</bdi></div>
        <label className="fields">{t('pay.cash')}<input autoFocus inputMode="numeric" value={cash} onChange={(e) => setCash(digits(e.target.value))} /></label>
        <div className="buttons">
          {quick.map((q) => <button key={q} type="button" onClick={() => setCash(String(q))}>{q === props.total ? t('pay.exact') : <bdi>{money(q)}</bdi>}</button>)}
        </div>
        <label className="fields">{t('pay.card')}<input inputMode="numeric" value={card} onChange={(e) => setCard(digits(e.target.value))} /></label>
        <button type="button" className="ghost" onClick={() => { setCard(String(props.total)); setCash('') }}>{t('pay.allCard')}</button>
        <div className={`grand-total ${change < 0 ? 'error' : 'ok'}`}>
          <span>{change < 0 ? t('pay.missing') : t('pay.change')}</span><bdi>{money(Math.abs(change))}</bdi>
        </div>
        {ownerPin !== null && (
          <label className="fields">{t('pay.ownerPin')}
            <input type="password" inputMode="numeric" autoFocus autoComplete="off" value={ownerPin} onChange={(e) => setOwnerPin(digits(e.target.value).slice(0, 6))} />
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="buttons">
          <button type="button" onClick={props.onClose} disabled={busy}>{t('common.cancel')}</button>
          <button type="submit" className="primary big" disabled={busy || change < 0 || (ownerPin !== null && ownerPin.length < 4)}>{t('pay.complete')}</button>
        </div>
      </form>
    </Modal>
  )
}

function HeldDialog({ onRecall, onClose }: { onRecall: (h: HeldCart) => void; onClose: () => void }) {
  const { t, errorText, lang } = useI18n()
  const [held, setHeld] = useState<HeldCart[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    call('sell:held').then(setHeld, (err) => setError(errorText(err)))
  }, [errorText])
  return (
    <Modal title={t('sell.heldTitle')} onClose={onClose}>
      {held && held.length === 0 && <p className="muted">{t('sell.noHeld')}</p>}
      <div className="variant-picker">
        {held?.map((h) => (
          <button key={h.id} onClick={() => onRecall(h)}>
            <span className="strong">{h.cart.note || new Date(h.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="muted small">{h.userName} · {h.cart.lines.reduce((s, l) => s + l.qty, 0)} {t('sell.qty')}</span>
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </Modal>
  )
}
