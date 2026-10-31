import { useEffect, useState } from 'react'

import type { AppInfo, Language, ShopInfo } from '../../shared/ipc'
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
