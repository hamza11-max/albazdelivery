import { useState } from 'react'

import { useAuth } from './auth'
import { useI18n, type MessageKey } from './i18n'
import { History } from './pages/History'
import { Placeholder } from './pages/Placeholder'
import { Products } from './pages/Products'
import { Sell } from './pages/Sell'
import { Settings } from './pages/Settings'

const PAGES = ['sell', 'history', 'products', 'stock', 'reports', 'settings'] as const
type Page = (typeof PAGES)[number]

const ICONS: Record<Page, string> = {
  sell: '🛒',
  history: '🧾',
  products: '👕',
  stock: '📦',
  reports: '📊',
  settings: '⚙️',
}

export function App() {
  const { t, lang, setLang } = useI18n()
  const { session, shopName, lock } = useAuth()
  const [page, setPage] = useState<Page>('sell')

  return (
    <div className="shell">
      <nav className="rail" aria-label={t('app.name')}>
        <div className="brand">AL-baz</div>
        {PAGES.map((p) => (
          <button
            key={p}
            className="rail-item"
            aria-current={page === p ? 'page' : undefined}
            onClick={() => setPage(p)}
          >
            <span className="rail-icon" aria-hidden="true">{ICONS[p]}</span>
            <span>{t(`nav.${p}` as MessageKey)}</span>
          </button>
        ))}
      </nav>

      <header className="topbar">
        <h1>{t(`nav.${page}` as MessageKey)}</h1>
        <div className="topbar-end">
          <span className="muted small">{shopName}</span>
          <span className="sync" title={t('status.local')}>● {t('status.local')}</span>
          <span className="who">
            <span className="strong">{session.name}</span>
            <span className="muted small"> · {t(`role.${session.role}` as MessageKey)}</span>
          </span>
          <button className="lang" onClick={() => void lock()}>🔒 {t('session.lock')}</button>
          <button className="lang" onClick={() => void setLang(lang === 'ar' ? 'fr' : 'ar')}>
            {lang === 'ar' ? 'Français' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="content">
        {page === 'settings' ? <Settings /> : page === 'products' ? <Products /> : page === 'sell' ? <Sell /> : page === 'history' ? <History /> : <Placeholder text={t(`empty.${page}` as MessageKey)} />}
      </main>
    </div>
  )
}
