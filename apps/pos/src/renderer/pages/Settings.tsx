import { useEffect, useState } from 'react'

import type { AppInfo, Language } from '../../shared/ipc'
import { call } from '../api'
import { useI18n } from '../i18n'
import { PrintTest } from './PrintTest'

export function Settings() {
  const { t, lang, setLang } = useI18n()
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

      <section className="card wide">
        <h2>{t('settings.printTest')}</h2>
        <PrintTest />
      </section>
    </div>
  )
}
