import { useEffect, useState } from 'react'

import type { AppInfo, Language, SalesSettings, ShopInfo } from '../../shared/ipc'
import { call } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { PrintTest } from './PrintTest'
import { Users } from './Users'

export function Settings() {
  const { t, lang, setLang } = useI18n()
  const { isOwner } = useAuth()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    call('app:info').then(setInfo, (err: Error) => setError(err.message))
  }, [])

  return (
    <div className="settings">
      <section className="card">
        <h2>{t('settings.language')}</h2>
        <select value={lang} onChange={(e) => void setLang(e.target.value as Language)} aria-label={t('settings.language')}>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
        </select>
      </section>

      {isOwner && <ShopCard />}
      {isOwner && <SalesSettingsCard />}
      {isOwner && <section className="card wide"><h2>{t('users.title')}</h2><Users /></section>}

      <section className="card">
        <h2>{t('settings.database')}</h2>
        {error && <p className="error" role="alert">{t('common.error')}: {error}</p>}
        {!info && !error && <p>{t('common.loading')}</p>}
        {info && (
          <dl className="facts">
            <dt>{t('settings.dbVersion')}</dt>
            <dd>{info.database.schemaVersion}</dd>
            <dt>{t('settings.migrations')}</dt>
            <dd><bdi>{info.database.migrations.map((m) => `${m.version}_${m.name}`).join(', ')}</bdi></dd>
            <dt>{t('settings.dbPath')}</dt>
            <dd className="mono"><bdi>{info.database.path}</bdi></dd>
            <dt>{t('settings.app')}</dt>
            <dd className="mono"><bdi>v{info.appVersion} · Electron {info.electronVersion}</bdi></dd>
          </dl>
        )}
      </section>

      {isOwner && (
        <section className="card wide">
          <h2>{t('settings.printTest')}</h2>
          <PrintTest />
        </section>
      )}
    </div>
  )
}

function ShopCard() {
  const { t, errorText } = useI18n()
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    call('shop:get').then(setShop, (err) => setStatus({ tone: 'err', text: errorText(err) }))
  }, [errorText])

  if (!shop) return null
  const set = (k: keyof ShopInfo, v: string) => setShop({ ...shop, [k]: v })

  return (
    <section className="card">
      <h2>{t('settings.shop')}</h2>
      <form className="fields" onSubmit={(e) => {
        e.preventDefault()
        call('shop:save', shop).then((saved) => { setShop(saved); setStatus({ tone: 'ok', text: t('settings.saved') }) },
          (err) => setStatus({ tone: 'err', text: errorText(err) }))
      }}>
        <label>{t('setup.shopName')}<input required maxLength={80} value={shop.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>{t('setup.phone')}<input maxLength={30} value={shop.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <label>{t('setup.address')}<input maxLength={160} value={shop.address} onChange={(e) => set('address', e.target.value)} /></label>
        <label>{t('settings.receiptFooter')}<input maxLength={300} value={shop.receiptFooter} onChange={(e) => set('receiptFooter', e.target.value)} /></label>
        <div className="buttons"><button type="submit" className="primary">{t('common.save')}</button></div>
        {status && <p className={`status ${status.tone}`} role="status">{status.text}</p>}
      </form>
    </section>
  )
}

/** Owner: cashier discount cap, negative stock, and the receipt printer. */
export function SalesSettingsCard() {
  const { t, errorText } = useI18n()
  const [s, setS] = useState<SalesSettings | null>(null)
  const [printers, setPrinters] = useState<{ name: string; displayName: string }[]>([])
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    call('settings:sales').then(setS, (err) => setStatus({ tone: 'err', text: errorText(err) }))
    call('print:printers').then(setPrinters, () => setPrinters([]))
  }, [errorText])
  if (!s) return null
  const setReceipt = (patch: Partial<SalesSettings['receipt']>) => setS({ ...s, receipt: { ...s.receipt, ...patch } })

  return (
    <section className="card">
      <h2>{t('settings.sales')}</h2>
      <form className="fields" onSubmit={(e) => {
        e.preventDefault()
        call('settings:saveSales', s).then((saved) => { setS(saved); setStatus({ tone: 'ok', text: t('settings.saved') }) },
          (err) => setStatus({ tone: 'err', text: errorText(err) }))
      }}>
        <label>{t('settings.discountCap')}
          <input inputMode="numeric" value={s.cashierDiscountCapPercent} onChange={(e) => setS({ ...s, cashierDiscountCapPercent: Math.min(100, Number(e.target.value.replace(/[^\d]/g, '') || 0)) })} />
        </label>
        <label>{t('settings.returnWindow')}
          <input inputMode="numeric" value={s.returnWindowDays} onChange={(e) => setS({ ...s, returnWindowDays: Math.min(365, Number(e.target.value.replace(/[^\d]/g, '') || 0)) })} />
        </label>
        <label className="check-row"><input type="checkbox" checked={s.allowNegativeStock} onChange={(e) => setS({ ...s, allowNegativeStock: e.target.checked })} /> {t('settings.negativeStock')}</label>
        <label>{t('settings.receiptPrinter')}
          <select value={s.receipt.printer} onChange={(e) => setReceipt({ printer: e.target.value })}>
            <option value="">{t('settings.noReceiptPrinter')}</option>
            {printers.map((p) => <option key={p.name} value={p.name}>{p.displayName}</option>)}
          </select>
        </label>
        <label>{t('print.paper')}
          <select value={s.receipt.paper} onChange={(e) => setReceipt({ paper: Number(e.target.value) as 58 | 80 })}>
            <option value={80}>80 mm</option><option value={58}>58 mm</option>
          </select>
        </label>
        <label>{t('settings.route')}
          <select value={s.receipt.route} onChange={(e) => setReceipt({ route: e.target.value as 'raster' | 'driver' })}>
            <option value="raster">{t('settings.routeRaster')}</option><option value="driver">{t('settings.routeDriver')}</option>
          </select>
        </label>
        <label>{t('settings.receiptLang')}
          <select value={s.receipt.lang} onChange={(e) => setReceipt({ lang: e.target.value as 'ar' | 'fr' | 'mixed' })}>
            <option value="mixed">العربية + Français</option><option value="ar">العربية</option><option value="fr">Français</option>
          </select>
        </label>
        <label className="check-row"><input type="checkbox" checked={s.receipt.autoPrint} onChange={(e) => setReceipt({ autoPrint: e.target.checked })} /> {t('settings.autoPrint')}</label>
        <label className="check-row"><input type="checkbox" checked={s.receipt.openDrawer} onChange={(e) => setReceipt({ openDrawer: e.target.checked })} /> {t('settings.openDrawer')}</label>
        <div className="buttons"><button type="submit" className="primary">{t('common.save')}</button></div>
        {status && <p className={`status ${status.tone}`} role="status">{status.text}</p>}
      </form>
    </section>
  )
}
