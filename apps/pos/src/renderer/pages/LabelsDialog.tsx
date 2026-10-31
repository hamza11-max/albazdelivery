import { useCallback, useEffect, useState } from 'react'

import { LABEL_LAYOUTS, type LabelLayout } from '../../shared/constants'
import type { ProductDetail } from '../../shared/ipc'
import { call } from '../api'
import { useI18n, type MessageKey } from '../i18n'

/** Remembered per PC for convenience; the app works the same without it. */
function remembered<T extends string>(key: string, fallback: T, allowed?: readonly string[]): T {
  try {
    const v = localStorage.getItem(key)
    return v && (!allowed || allowed.includes(v)) ? (v as T) : fallback
  } catch {
    return fallback
  }
}
function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: ignore */
  }
}

export function LabelsDialog({ product, onClose }: { product: ProductDetail; onClose: (changed: boolean) => void }) {
  const { t, errorText } = useI18n()
  const [variants, setVariants] = useState(product.variants)
  const [copies, setCopies] = useState<Record<string, string>>(() => Object.fromEntries(product.variants.map((v) => [v.id, '1'])))
  const [layout, setLayout] = useState<LabelLayout>(() => remembered('labels.layout', 'roll-50x30', LABEL_LAYOUTS))
  const [skip, setSkip] = useState('0')
  const [showPrice, setShowPrice] = useState(true)
  const [printers, setPrinters] = useState<{ name: string; displayName: string }[]>([])
  const [printer, setPrinter] = useState('')
  const [preview, setPreview] = useState<{ dataUrl: string; pages: number; labels: number; missingBarcodes: string[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [changed, setChanged] = useState(false)

  const isSheet = layout.startsWith('a4')
  const items = variants
    .map((v) => ({ variantId: v.id, copies: Number(copies[v.id] || 0) }))
    .filter((i) => i.copies > 0)
  const job = { items, layout, skip: isSheet ? Number(skip || 0) : 0, showPrice }

  useEffect(() => {
    call('print:printers').then((list) => {
      setPrinters(list)
      const saved = remembered('labels.printer', '')
      setPrinter(list.some((p) => p.name === saved) ? saved : list[0]?.name ?? '')
    }, () => setPrinters([]))
  }, [])

  const refresh = useCallback(async () => {
    if (items.length === 0) return setPreview(null)
    try {
      setPreview(await call('labels:preview', job))
    } catch (err) {
      setMessage({ tone: 'err', text: errorText(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(job), errorText])

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 300)
    return () => clearTimeout(timer)
  }, [refresh])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose(changed)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, changed, onClose])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
    } catch (err) {
      setMessage({ tone: 'err', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  const label = (v: (typeof variants)[number]) => [v.option1Value, v.option2Value].filter(Boolean).join(' / ') || product.name

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose(changed)}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="labels-title">
        <header className="drawer-head">
          <h2 id="labels-title">{t('labels.title')} — <bdi>{product.name}</bdi></h2>
          <button className="ghost" onClick={() => onClose(changed)} disabled={busy} aria-label={t('common.close')}>✕</button>
        </header>

        <div className="drawer-body labels-body">
          <div className="labels-form">
            <table className="grid compact">
              <thead>
                <tr><th>{t('editor.variants')}</th><th>{t('editor.barcode')}</th><th className="num">{t('editor.stock')}</th><th>{t('labels.copies')}</th></tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td><bdi>{label(v)}</bdi></td>
                    <td className="mono small">{v.barcode || '—'}</td>
                    <td className="num">{v.stockQty}</td>
                    <td>
                      <input inputMode="numeric" aria-label={`${t('labels.copies')} ${label(v)}`} value={copies[v.id] ?? ''}
                        onChange={(e) => setCopies({ ...copies, [v.id]: e.target.value.replace(/[^\d]/g, '').slice(0, 3) })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="ghost" onClick={() => setCopies(Object.fromEntries(variants.map((v) => [v.id, String(Math.max(0, v.stockQty))])))}>
              {t('labels.copiesFromStock')}
            </button>

            <div className="fields">
              <label>
                {t('labels.layout')}
                <select value={layout} onChange={(e) => { setLayout(e.target.value as LabelLayout); remember('labels.layout', e.target.value) }}>
                  {LABEL_LAYOUTS.map((l) => <option key={l} value={l}>{t(`labels.${l}` as MessageKey)}</option>)}
                </select>
              </label>
              {isSheet && (
                <label>
                  {t('labels.skip')}
                  <input inputMode="numeric" value={skip} onChange={(e) => setSkip(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} />
                </label>
              )}
              <label className="check-row">
                <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} /> {t('labels.showPrice')}
              </label>
              <label>
                {t('print.printer')}
                <select value={printer} onChange={(e) => { setPrinter(e.target.value); remember('labels.printer', e.target.value) }} disabled={printers.length === 0}>
                  {printers.length === 0 && <option value="">{t('print.noPrinters')}</option>}
                  {printers.map((p) => <option key={p.name} value={p.name}>{p.displayName}</option>)}
                </select>
              </label>
            </div>

            {preview && preview.missingBarcodes.length > 0 && (
              <div className="notice">
                <p>{preview.missingBarcodes.length} {t('labels.missing')}</p>
                <button disabled={busy} onClick={() => run(async () => {
                  await call('labels:assignBarcodes', { variantIds: preview.missingBarcodes })
                  const fresh = await call('catalog:product', { id: product.id })
                  setVariants(fresh.variants)
                  setChanged(true)
                })}>{t('labels.assign')}</button>
              </div>
            )}

            {message && <p className={`status ${message.tone}`} role="status">{message.text}</p>}
          </div>

          <div className="labels-preview">
            {preview ? (
              <>
                <img src={preview.dataUrl} alt={t('print.preview')} />
                <p className="muted small">{preview.labels} / {preview.pages} — {t('labels.summary')}</p>
              </>
            ) : (
              <p className="muted">{t('common.loading')}</p>
            )}
          </div>
        </div>

        <footer className="drawer-foot padded">
          <span className="spacer" />
          <button disabled={busy} onClick={() => onClose(changed)}>{t('common.close')}</button>
          <button className="primary" disabled={busy || !printer || items.length === 0} onClick={() => run(async () => {
            const done = await call('labels:print', { ...job, printer })
            setMessage({ tone: 'ok', text: `${t('labels.printed')} ${done.labels} / ${done.pages}` })
          })}>{t('labels.print')}{preview ? ` (${preview.labels})` : ''}</button>
        </footer>
      </section>
    </div>
  )
}
