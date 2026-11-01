import { useEffect, useState } from 'react'

import type { ImportIssue, ImportPreview } from '../../shared/ipc'
import { call } from '../api'
import { useI18n, type MessageKey } from '../i18n'

/** Import fields (and the schema fields they become) → the editor's labels. */
const FIELD_LABELS: Record<string, MessageKey> = {
  name: 'editor.name',
  nameAlt: 'editor.nameAlt',
  category: 'editor.category',
  brand: 'editor.brand',
  costPrice: 'editor.costPrice',
  salePrice: 'editor.salePrice',
  option1Name: 'editor.optionName',
  option2Name: 'editor.optionName',
  option1Value: 'editor.optionValues',
  option2Value: 'editor.optionValues',
  sku: 'editor.sku',
  barcode: 'editor.barcode',
  variantPrice: 'editor.priceOverride',
  lowStock: 'editor.lowStock',
  lowStockThreshold: 'editor.lowStock',
}

export function ImportDialog({ onClose }: { onClose: (imported: boolean) => void }) {
  const { t, errorText, money } = useI18n()
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

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

  const issueText = (i: ImportIssue) => {
    const base = t(`issue.${i.code}` as MessageKey) ?? i.code
    const label = i.field ? FIELD_LABELS[i.field] : undefined
    const field = i.field ? ` (${label ? t(label) : i.field})` : ''
    const detail = i.detail ? ` ${i.detail}` : ''
    return `${base}${field}${detail}`
  }

  const canImport = preview !== null && preview.errorCount === 0 && preview.products > 0

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose(false)}>
      <section className="drawer narrow" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header className="drawer-head">
          <h2 id="import-title">{t('import.title')}</h2>
          <button className="ghost" onClick={() => onClose(false)} disabled={busy} aria-label={t('common.close')}>✕</button>
        </header>

        <div className="drawer-body">
          <p className="muted">{t('import.help')}</p>
          <div className="buttons">
            <button disabled={busy} onClick={() => run(async () => {
              const saved = await call('import:template')
              if (saved) setMessage({ tone: 'ok', text: `${t('import.templateSaved')} ${saved.path}` })
            })}>{t('import.template')}</button>
            <button className="primary" disabled={busy} onClick={() => run(async () => {
              const result = await call('import:preview')
              if (result) setPreview(result)
            })}>{t('import.choose')}</button>
          </div>

          {preview && (
            <>
              <h3><bdi>{preview.fileName}</bdi></h3>
              {preview.products === 0 && preview.errorCount === 0 && <p>{t('import.nothing')}</p>}
              <p className={canImport ? 'status ok' : ''}>
                {canImport && `${t('import.ready')}: `}
                <strong>{preview.products}</strong> {t('import.products')} · <strong>{preview.variants}</strong> {t('import.variants')}
                {preview.stockUnits > 0 && <> · <strong>{preview.stockUnits}</strong> {t('import.stockUnits')}</>}
              </p>
              {preview.newCategories.length > 0 && (
                <p className="muted">{t('import.newCategories')}: <bdi>{preview.newCategories.join('، ')}</bdi></p>
              )}

              {preview.errorCount > 0 ? (
                <>
                  <h3 className="error">{t('import.errors')} ({preview.errorCount})</h3>
                  <table className="grid compact issues">
                    <thead><tr><th className="num">{t('import.row')}</th><th>{t('import.problem')}</th></tr></thead>
                    <tbody>
                      {preview.errors.map((i, n) => (
                        <tr key={n}><td className="num">{i.row}</td><td><bdi>{issueText(i)}</bdi></td></tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.errorCount > preview.errors.length && <p className="muted">+{preview.errorCount - preview.errors.length} {t('import.moreErrors')}</p>}
                </>
              ) : (
                preview.sample.length > 0 && (
                  <table className="grid compact">
                    <thead><tr><th>{t('products.colName')}</th><th>{t('products.colCategory')}</th><th className="num">{t('products.colVariants')}</th><th className="num">{t('products.colPrice')}</th></tr></thead>
                    <tbody>
                      {preview.sample.map((p, n) => (
                        <tr key={n}>
                          <td>{p.name}{p.nameAlt && <div className="muted small"><bdi>{p.nameAlt}</bdi></div>}</td>
                          <td>{p.category || '—'}</td>
                          <td className="num">{p.variants}</td>
                          <td className="num"><bdi>{money(p.salePrice)}</bdi></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </>
          )}

          {message && <p className={`status ${message.tone}`} role="status">{message.text}</p>}

          <footer className="drawer-foot">
            <span className="spacer" />
            <button disabled={busy} onClick={() => onClose(false)}>{t('common.close')}</button>
            <button className="primary" disabled={busy || !canImport} onClick={() => run(async () => {
              const done = await call('import:commit', { token: preview!.token })
              setMessage({ tone: 'ok', text: `${t('import.done')} ${done.products} ${t('import.products')}, ${done.variants} ${t('import.variants')}${done.stockUnits ? `, ${done.stockUnits} ${t('import.stockUnits')}` : ''}` })
              setPreview(null)
              setTimeout(() => onClose(true), 900)
            })}>
              {t('import.commit')}{canImport ? ` (${preview!.products})` : ''}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}
