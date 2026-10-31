import { useEffect, useState } from 'react'

import type { ReceiptOptions } from '../../shared/ipc'
import { call } from '../api'
import { useI18n } from '../i18n'

/** The Phase 2 printer test, kept reachable from Settings until real printing lands. */
export function PrintTest() {
  const { t } = useI18n()
  const [options, setOptions] = useState<ReceiptOptions>({ lang: 'mixed', paper: 80 })
  const [printers, setPrinters] = useState<{ name: string; displayName: string }[]>([])
  const [printer, setPrinter] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    call('print:printers').then((list) => {
      setPrinters(list)
      setPrinter(list[0]?.name ?? '')
    }, () => setPrinters([]))
  }, [])

  async function run(fn: () => Promise<string | void>) {
    setBusy(true)
    setStatus(null)
    try {
      const text = await fn()
      if (text) setStatus({ tone: 'ok', text })
    } catch (err) {
      setStatus({ tone: 'err', text: `${t('common.error')}: ${(err as Error).message}` })
    } finally {
      setBusy(false)
    }
  }

  const target = { kind: 'windows' as const, printer }

  return (
    <div className="print-test">
      <div className="form-row">
        <label>
          {t('print.language')}
          <select value={options.lang} onChange={(e) => setOptions({ ...options, lang: e.target.value as ReceiptOptions['lang'] })}>
            <option value="mixed">العربية + Français</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <label>
          {t('print.paper')}
          <select value={options.paper} onChange={(e) => setOptions({ ...options, paper: Number(e.target.value) as 58 | 80 })}>
            <option value={80}>80 mm</option>
            <option value={58}>58 mm</option>
          </select>
        </label>
        <label>
          {t('print.printer')}
          <select value={printer} onChange={(e) => setPrinter(e.target.value)} disabled={printers.length === 0}>
            {printers.length === 0 && <option value="">{t('print.noPrinters')}</option>}
            {printers.map((p) => <option key={p.name} value={p.name}>{p.displayName}</option>)}
          </select>
        </label>
      </div>

      <div className="buttons">
        <button disabled={busy} onClick={() => run(async () => setPreview((await call('print:preview', options)).dataUrl))}>{t('print.preview')}</button>
        <button className="primary" disabled={busy || !printer} onClick={() => run(async () => { await call('print:raster', { options, target, openDrawer: false }); return t('print.sent') })}>{t('print.raster')}</button>
        <button disabled={busy || !printer} onClick={() => run(async () => { await call('print:driver', { options, printer }); return t('print.sent') })}>{t('print.driver')}</button>
        <button disabled={busy || !printer} onClick={() => run(async () => { await call('print:drawer', { target }); return t('print.sent') })}>{t('print.drawer')}</button>
      </div>

      <p className={`status ${status?.tone ?? ''}`} role="status" aria-live="polite">{status?.text}</p>
      {preview && <img className="receipt-preview" src={preview} alt={t('print.preview')} />}
    </div>
  )
}
