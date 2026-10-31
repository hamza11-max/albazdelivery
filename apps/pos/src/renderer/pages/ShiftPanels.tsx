import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'

import type { ShiftClosed, ShiftStatus } from '../../shared/ipc'
import { ApiError, call } from '../api'
import { useI18n } from '../i18n'

const digits = (s: string) => s.replace(/[^\d]/g, '').slice(0, 10)

/** Centered dialog; Escape and the backdrop close it unless busy. */
export function Modal({ title, onClose, busy, children }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])
  return (
    <div className="drawer-backdrop center" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-head"><h2>{title}</h2></header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}

export function OpenShift({ onOpened }: { onOpened: (s: ShiftStatus) => void }) {
  const { t, errorText } = useI18n()
  const [float, setFloat] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <section className="empty open-shift">
      <h2>{t('shift.closedTitle')}</h2>
      <form className="fields" onSubmit={(e) => {
        e.preventDefault()
        call('shift:open', { openingFloat: Number(float || 0) }).then(onOpened, (err) => setError(errorText(err)))
      }}>
        <label>{t('shift.openingFloat')}<input autoFocus inputMode="numeric" value={float} onChange={(e) => setFloat(digits(e.target.value))} /></label>
        <button type="submit" className="primary big">{t('shift.open')}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}

export function CashDialog({ type, onDone, onClose }: { type: 'IN' | 'OUT'; onDone: (s: ShiftStatus) => void; onClose: () => void }) {
  const { t, errorText } = useI18n()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <Modal title={type === 'IN' ? t('shift.cashIn') : t('shift.cashOut')} onClose={onClose}>
      <form className="fields" onSubmit={(e) => {
        e.preventDefault()
        call('shift:cash', { type, amount: Number(amount || 0), reason }).then(onDone, (err) => setError(errorText(err)))
      }}>
        <label>{t('shift.amount')}<input autoFocus required inputMode="numeric" value={amount} onChange={(e) => setAmount(digits(e.target.value))} /></label>
        <label>{t('shift.reason')}<input required maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="buttons"><button type="button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary">{t('common.save')}</button></div>
      </form>
    </Modal>
  )
}

/** Blind count: the cashier types what is in the drawer; the expected amount is shown only afterwards. */
export function CloseShiftDialog({ onClosed, onClose }: { onClosed: () => void; onClose: () => void }) {
  const { t, money, errorText } = useI18n()
  const [counted, setCounted] = useState('')
  const [reason, setReason] = useState('')
  const [difference, setDifference] = useState<number | null>(null)
  const [result, setResult] = useState<ShiftClosed | null>(null)
  const [error, setError] = useState<string | null>(null)
  const reasonRef = useRef<HTMLInputElement>(null)

  async function submit() {
    setError(null)
    try {
      setResult(await call('shift:close', { countedCash: Number(counted || 0), reason }))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REASON_REQUIRED') {
        setDifference(Number(err.message))
        setTimeout(() => reasonRef.current?.focus(), 0)
      } else setError(errorText(err))
    }
  }

  if (result) {
    const rows: [string, number][] = [
      [t('shift.openingFloat'), result.openingFloat],
      [`${t('shift.sales')} (${result.salesCount})`, result.salesTotal],
      [t('shift.card'), result.cardTotal],
      [t('shift.cashIn'), result.cashIn],
      [t('shift.cashOut'), result.cashOut],
      [t('shift.expected'), result.expectedCash],
      [t('shift.counted'), result.countedCash],
      [t('shift.difference'), result.difference],
    ]
    return (
      <Modal title={t('shift.closedSummary')} onClose={onClosed}>
        <dl className="facts z">
          {rows.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd className={k === t('shift.difference') && v !== 0 ? 'error' : ''}><bdi>{money(v)}</bdi></dd>
            </Fragment>
          ))}
        </dl>
        <div className="buttons"><button className="primary" autoFocus onClick={onClosed}>{t('common.close')}</button></div>
      </Modal>
    )
  }

  return (
    <Modal title={t('shift.close')} onClose={onClose}>
      <form className="fields" onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <label>{t('shift.counted')}<input autoFocus required inputMode="numeric" value={counted} onChange={(e) => { setCounted(digits(e.target.value)); setDifference(null) }} /></label>
        {difference !== null && (
          <>
            <p className={difference < 0 ? 'error' : 'status'}>{t('shift.difference')}: <bdi>{money(difference)}</bdi> — {t('shift.differenceReason')}</p>
            <label>{t('shift.reason')}<input ref={reasonRef} required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="buttons"><button type="button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary">{t('shift.close')}</button></div>
      </form>
    </Modal>
  )
}
