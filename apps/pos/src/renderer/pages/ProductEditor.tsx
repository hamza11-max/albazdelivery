import { useEffect, useRef, useState } from 'react'

import type { Category, Inputs, ProductDetail } from '../../shared/ipc'
import { call } from '../api'
import { useI18n } from '../i18n'

interface VariantRow {
  key: string
  id?: string
  option1Value: string
  option2Value: string
  sku: string
  barcode: string
  /** Text inputs; '' means "use product price" / "no alert". */
  salePrice: string
  lowStockThreshold: string
  stockQty: number
}

interface Form {
  name: string
  nameAlt: string
  categoryId: string | null
  brand: string
  costPrice: string
  salePrice: string
  option1Name: string
  option1Values: string
  option2Name: string
  option2Values: string
  variants: VariantRow[]
}

let rowSeq = 0
const newRow = (o1 = '', o2 = ''): VariantRow => ({
  key: `r${++rowSeq}`, option1Value: o1, option2Value: o2, sku: '', barcode: '', salePrice: '', lowStockThreshold: '', stockQty: 0,
})

const EMPTY: Form = {
  name: '', nameAlt: '', categoryId: null, brand: '', costPrice: '', salePrice: '',
  option1Name: '', option1Values: '', option2Name: '', option2Values: '', variants: [newRow()],
}

/** "S, M ،L" → ["S", "M", "L"] (also splits on the Arabic comma). */
const splitValues = (text: string) => [...new Set(text.split(/[,،]/).map((v) => v.trim()).filter(Boolean))]
const digits = (text: string) => text.replace(/[^\d]/g, '')
const intOrNull = (text: string) => (text === '' ? null : Number(text))

function fromDetail(p: ProductDetail): Form {
  const unique = (vals: string[]) => [...new Set(vals.filter(Boolean))].join(', ')
  return {
    name: p.name, nameAlt: p.nameAlt, categoryId: p.categoryId, brand: p.brand,
    costPrice: String(p.costPrice), salePrice: String(p.salePrice),
    option1Name: p.option1Name, option1Values: unique(p.variants.map((v) => v.option1Value)),
    option2Name: p.option2Name, option2Values: unique(p.variants.map((v) => v.option2Value)),
    variants: p.variants.map((v) => ({
      key: v.id, id: v.id, option1Value: v.option1Value, option2Value: v.option2Value, sku: v.sku, barcode: v.barcode,
      salePrice: v.salePrice === null ? '' : String(v.salePrice),
      lowStockThreshold: v.lowStockThreshold === null ? '' : String(v.lowStockThreshold),
      stockQty: v.stockQty,
    })),
  }
}

export function ProductEditor(props: {
  productId: string | null
  categories: Category[]
  onCategoriesChanged: () => Promise<void> | void
  onClose: (changed: boolean) => void
}) {
  const { t, errorText } = useI18n()
  const [form, setForm] = useState<Form>(EMPTY)
  const [version, setVersion] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(props.productId !== null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!props.productId) return
    call('catalog:product', { id: props.productId }).then(
      (p) => {
        setForm(fromDetail(p))
        setVersion(p.version)
        setLoading(false)
      },
      (err) => {
        setError(errorText(err))
        setLoading(false)
      },
    )
  }, [props.productId, errorText])

  useEffect(() => {
    if (!loading) nameRef.current?.focus()
  }, [loading])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && props.onClose(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, props])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const setRow = (key: string, patch: Partial<VariantRow>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }))

  /** Builds the size × colour grid, keeping rows (and their codes) that already exist. */
  function generateVariants() {
    const o1 = form.option1Name ? splitValues(form.option1Values) : ['']
    const o2 = form.option2Name ? splitValues(form.option2Values) : ['']
    const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
    const rows: VariantRow[] = []
    for (const a of o1.length ? o1 : ['']) {
      for (const b of o2.length ? o2 : ['']) {
        rows.push(form.variants.find((v) => same(v.option1Value, a) && same(v.option2Value, b)) ?? newRow(a, b))
      }
    }
    set('variants', rows)
  }

  async function generateBarcode(key: string) {
    try {
      const { barcode } = await call('catalog:newBarcode')
      setRow(key, { barcode })
    } catch (err) {
      setError(errorText(err))
    }
  }

  async function createCategory() {
    if (!newCategory?.trim()) return
    try {
      const c = await call('catalog:saveCategory', { name: newCategory })
      await props.onCategoriesChanged()
      set('categoryId', c.id)
      setNewCategory(null)
    } catch (err) {
      setError(errorText(err))
    }
  }

  async function save() {
    setBusy(true)
    setError(null)
    const payload: Inputs['catalog:saveProduct'] = {
      ...(props.productId ? { id: props.productId, version } : {}),
      name: form.name,
      nameAlt: form.nameAlt,
      categoryId: form.categoryId,
      brand: form.brand,
      costPrice: Number(form.costPrice || 0),
      salePrice: Number(form.salePrice || 0),
      option1Name: form.option1Name,
      option2Name: form.option1Name ? form.option2Name : '',
      variants: form.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        option1Value: form.option1Name ? v.option1Value : '',
        option2Value: form.option1Name && form.option2Name ? v.option2Value : '',
        sku: v.sku,
        barcode: v.barcode,
        salePrice: intOrNull(v.salePrice),
        lowStockThreshold: intOrNull(v.lowStockThreshold),
      })),
    }
    try {
      await call('catalog:saveProduct', payload)
      props.onClose(true)
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  async function archive() {
    if (!props.productId || !window.confirm(t('editor.archiveConfirm'))) return
    setBusy(true)
    try {
      await call('catalog:archiveProduct', { id: props.productId })
      props.onClose(true)
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  const hasOptions = form.option1Name.trim() !== ''

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && props.onClose(false)}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header className="drawer-head">
          <h2 id="editor-title">{props.productId ? t('editor.edit') : t('editor.new')}</h2>
          <button className="ghost" onClick={() => props.onClose(false)} disabled={busy} aria-label={t('common.close')}>✕</button>
        </header>

        {loading ? (
          <p className="drawer-body">{t('common.loading')}</p>
        ) : (
          <form className="drawer-body" onSubmit={(e) => { e.preventDefault(); void save() }}>
            <div className="fields two">
              <label>{t('editor.name')}<input ref={nameRef} required maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
              <label>{t('editor.nameAlt')}<input maxLength={120} value={form.nameAlt} onChange={(e) => set('nameAlt', e.target.value)} /></label>
              <label>
                {t('editor.category')}
                {newCategory === null ? (
                  <select
                    value={form.categoryId ?? ''}
                    onChange={(e) => (e.target.value === '__new' ? setNewCategory('') : set('categoryId', e.target.value || null))}
                  >
                    <option value="">{t('editor.noCategory')}</option>
                    {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="__new">{t('editor.newCategory')}</option>
                  </select>
                ) : (
                  <span className="inline">
                    <input autoFocus maxLength={60} placeholder={t('editor.newCategoryName')} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void createCategory() } }} />
                    <button type="button" onClick={() => void createCategory()}>{t('common.save')}</button>
                    <button type="button" className="ghost" onClick={() => setNewCategory(null)}>{t('common.cancel')}</button>
                  </span>
                )}
              </label>
              <label>{t('editor.brand')}<input maxLength={60} value={form.brand} onChange={(e) => set('brand', e.target.value)} /></label>
              <label>{t('editor.costPrice')}<input inputMode="numeric" value={form.costPrice} onChange={(e) => set('costPrice', digits(e.target.value))} /></label>
              <label>{t('editor.salePrice')}<input inputMode="numeric" required value={form.salePrice} onChange={(e) => set('salePrice', digits(e.target.value))} /></label>
            </div>

            <fieldset>
              <legend>{t('editor.options')}</legend>
              <div className="fields options">
                <input placeholder={`${t('editor.optionName')} 1`} aria-label={`${t('editor.optionName')} 1`} maxLength={30} value={form.option1Name} onChange={(e) => set('option1Name', e.target.value)} />
                <input placeholder={t('editor.optionValues')} aria-label={`${t('editor.optionValues')} 1`} value={form.option1Values} disabled={!hasOptions} onChange={(e) => set('option1Values', e.target.value)} />
                <input placeholder={`${t('editor.optionName')} 2`} aria-label={`${t('editor.optionName')} 2`} maxLength={30} value={form.option2Name} disabled={!hasOptions} onChange={(e) => set('option2Name', e.target.value)} />
                <input placeholder={t('editor.optionValues')} aria-label={`${t('editor.optionValues')} 2`} value={form.option2Values} disabled={!hasOptions || !form.option2Name} onChange={(e) => set('option2Values', e.target.value)} />
              </div>
              <button type="button" onClick={generateVariants}>{t('editor.generate')}</button>
            </fieldset>

            <h3>{t('editor.variants')} ({form.variants.length})</h3>
            <div className="table-scroll">
              <table className="grid compact">
                <thead>
                  <tr>
                    {hasOptions && <th>{form.option1Name}</th>}
                    {hasOptions && form.option2Name && <th>{form.option2Name}</th>}
                    <th>{t('editor.sku')}</th>
                    <th>{t('editor.barcode')}</th>
                    <th>{t('editor.priceOverride')}</th>
                    <th>{t('editor.lowStock')}</th>
                    <th className="num">{t('editor.stock')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v) => (
                    <tr key={v.key}>
                      {hasOptions && <td><input aria-label={form.option1Name} value={v.option1Value} onChange={(e) => setRow(v.key, { option1Value: e.target.value })} /></td>}
                      {hasOptions && form.option2Name && <td><input aria-label={form.option2Name} value={v.option2Value} onChange={(e) => setRow(v.key, { option2Value: e.target.value })} /></td>}
                      <td><input className="mono" aria-label={t('editor.sku')} placeholder={t('editor.skuAuto')} value={v.sku} onChange={(e) => setRow(v.key, { sku: e.target.value.replace(/\s/g, '') })} /></td>
                      <td>
                        <span className="inline">
                          <input className="mono" aria-label={t('editor.barcode')} value={v.barcode} onChange={(e) => setRow(v.key, { barcode: e.target.value.replace(/\s/g, '') })} />
                          {!v.barcode && <button type="button" className="small" onClick={() => void generateBarcode(v.key)}>{t('editor.newBarcode')}</button>}
                        </span>
                      </td>
                      <td><input inputMode="numeric" aria-label={t('editor.priceOverride')} placeholder={form.salePrice} value={v.salePrice} onChange={(e) => setRow(v.key, { salePrice: digits(e.target.value) })} /></td>
                      <td><input inputMode="numeric" aria-label={t('editor.lowStock')} value={v.lowStockThreshold} onChange={(e) => setRow(v.key, { lowStockThreshold: digits(e.target.value) })} /></td>
                      <td className="num">{v.stockQty}</td>
                      <td>
                        {form.variants.length > 1 && (
                          <button type="button" className="ghost small" aria-label={t('common.remove')} onClick={() => set('variants', form.variants.filter((r) => r.key !== v.key))}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="ghost" onClick={() => set('variants', [...form.variants, newRow()])}>{t('editor.addVariant')}</button>

            {error && <p className="error" role="alert">{error}</p>}

            <footer className="drawer-foot">
              {props.productId && <button type="button" className="danger ghost" disabled={busy} onClick={() => void archive()}>{t('editor.archive')}</button>}
              <span className="spacer" />
              <button type="button" disabled={busy} onClick={() => props.onClose(false)}>{t('common.cancel')}</button>
              <button type="submit" className="primary" disabled={busy}>{t('common.save')}</button>
            </footer>
          </form>
        )}
      </section>
    </div>
  )
}
