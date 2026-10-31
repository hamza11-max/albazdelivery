import { useCallback, useEffect, useState } from 'react'

import type { Category, ProductSummary } from '../../shared/ipc'
import { call } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { ImportDialog } from './ImportDialog'
import { ProductEditor } from './ProductEditor'

const PAGE = 100

export function Products() {
  const { t, money, errorText } = useI18n()
  // Cashiers can look products up; editing, import and labels are owner-only (enforced in main).
  const { isOwner } = useAuth()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [stock, setStock] = useState<'all' | 'low' | 'out'>('all')
  const [rows, setRows] = useState<ProductSummary[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** null = closed, 'new' = create, otherwise the product id being edited. */
  const [editing, setEditing] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const load = useCallback(
    async (offset = 0) => {
      setLoading(true)
      try {
        const page = await call('catalog:products', { query, categoryId, stock, limit: PAGE, offset })
        setRows((prev) => (offset === 0 ? page.rows : [...prev, ...page.rows]))
        setTotal(page.total)
        setError(null)
      } catch (err) {
        setError(errorText(err))
      } finally {
        setLoading(false)
      }
    },
    [query, categoryId, stock, errorText],
  )

  const loadCategories = useCallback(() => call('catalog:categories').then(setCategories, () => setCategories([])), [])

  // Debounce typing so every keystroke does not hit the database.
  useEffect(() => {
    const timer = setTimeout(() => void load(0), 200)
    return () => clearTimeout(timer)
  }, [load])
  useEffect(() => void loadCategories(), [loadCategories])

  const filtered = query !== '' || categoryId !== null || stock !== 'all'

  return (
    <div className="products">
      <div className="toolbar">
        <input
          type="search"
          className="search"
          placeholder={t('products.search')}
          aria-label={t('products.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value || null)} aria-label={t('products.colCategory')}>
          <option value="">{t('products.allCategories')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={stock} onChange={(e) => setStock(e.target.value as typeof stock)} aria-label={t('products.colStock')}>
          <option value="all">{t('products.stockAll')}</option>
          <option value="low">{t('products.stockLow')}</option>
          <option value="out">{t('products.stockOut')}</option>
        </select>
        <span className="spacer" />
        {isOwner && <button onClick={() => setImporting(true)}>{t('import.button')}</button>}
        {isOwner && <button className="primary" onClick={() => setEditing('new')}>{t('products.add')}</button>}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {!loading && rows.length === 0 && !error ? (
        <section className="empty">
          <p>{filtered ? t('products.noMatch') : t('products.empty')}</p>
          {!filtered && isOwner && <button className="primary" onClick={() => setEditing('new')}>{t('products.add')}</button>}
        </section>
      ) : (
        <>
          <p className="muted count" aria-live="polite">{total} {t('products.count')}</p>
          <table className="grid">
            <thead>
              <tr>
                <th>{t('products.colName')}</th>
                <th>{t('products.colCategory')}</th>
                <th className="num">{t('products.colPrice')}</th>
                <th className="num">{t('products.colVariants')}</th>
                <th className="num">{t('products.colStock')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} tabIndex={isOwner ? 0 : undefined} className={isOwner ? '' : 'readonly'} onClick={() => isOwner && setEditing(p.id)} onKeyDown={(e) => isOwner && e.key === 'Enter' && setEditing(p.id)}>
                  <td>
                    <div className="strong">{p.name}</div>
                    {p.nameAlt && <div className="muted small"><bdi>{p.nameAlt}</bdi></div>}
                  </td>
                  <td>{p.categoryName ?? '—'}</td>
                  <td className="num"><bdi>{p.minPrice === p.maxPrice ? money(p.minPrice) : `${money(p.minPrice)} – ${money(p.maxPrice)}`}</bdi></td>
                  <td className="num">{p.variantCount}</td>
                  <td className="num">
                    <span className={p.outOfStockVariants > 0 ? 'badge err' : p.lowStockVariants > 0 ? 'badge warn' : ''}>{p.stockTotal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length < total && (
            <button className="load-more" disabled={loading} onClick={() => void load(rows.length)}>{t('common.loadMore')}</button>
          )}
        </>
      )}

      {importing && (
        <ImportDialog
          onClose={(imported) => {
            setImporting(false)
            if (imported) {
              void loadCategories()
              void load(0)
            }
          }}
        />
      )}

      {editing && (
        <ProductEditor
          productId={editing === 'new' ? null : editing}
          categories={categories}
          onCategoriesChanged={loadCategories}
          onClose={(changed) => {
            setEditing(null)
            if (changed) void load(0)
          }}
        />
      )}
    </div>
  )
}
