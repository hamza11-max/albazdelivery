import { useCallback, useEffect, useState } from 'react'

import type { UserSummary } from '../../shared/ipc'
import { ApiError, call } from '../api'
import { useI18n, type MessageKey } from '../i18n'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'ok'] as const

export function PinScreen({ shopName, onDone }: { shopName: string; onDone: () => void }) {
  const { t, lang, setLang, errorText } = useI18n()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [user, setUser] = useState<UserSummary | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    call('auth:users').then((list) => {
      setUsers(list)
      // One user (typical at first): go straight to the PIN pad.
      if (list.length === 1) setUser(list[0]!)
    }, (err) => setError(errorText(err)))
  }, [errorText])

  const submit = useCallback(async () => {
    if (!user || pin.length < 4 || busy) return
    setBusy(true)
    try {
      await call('auth:login', { userId: user.id, pin })
      onDone()
    } catch (err) {
      setPin('')
      if (err instanceof ApiError && err.code === 'WRONG_PIN') setError(`${t('pin.wrong')} ${err.message}`)
      else if (err instanceof ApiError && err.code === 'PIN_LOCKED') setError(`${t('pin.locked')} ${err.message}`)
      else setError(errorText(err))
      setBusy(false)
    }
  }, [user, pin, busy, onDone, t, errorText])

  const press = useCallback(
    (key: (typeof KEYS)[number]) => {
      setError(null)
      if (key === 'ok') return void submit()
      if (key === '⌫') return setPin((p) => p.slice(0, -1))
      setPin((p) => (p.length < 6 ? p + key : p))
    },
    [submit],
  )

  // Physical keyboard and number pad work too.
  useEffect(() => {
    if (!user) return
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key as (typeof KEYS)[number])
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') press('ok')
      else if (e.key === 'Escape' && users.length > 1) setUser(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [user, users.length, press])

  return (
    <main className="center-screen">
      <section className="card pin-card">
        <div className="lang-switch" role="group">
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => void setLang('ar')}>العربية</button>
          <button type="button" aria-pressed={lang === 'fr'} onClick={() => void setLang('fr')}>Français</button>
        </div>
        <p className="shop-name">{shopName}</p>

        {!user ? (
          <>
            <h1>{t('pin.title')}</h1>
            <div className="user-tiles">
              {users.map((u) => (
                <button key={u.id} className="user-tile" onClick={() => { setUser(u); setPin(''); setError(null) }}>
                  <span className="avatar" aria-hidden="true">{u.name.slice(0, 1).toUpperCase()}</span>
                  <span className="strong">{u.name}</span>
                  <span className="muted small">{t(`role.${u.role}` as MessageKey)}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1>{user.name}</h1>
            <p className="muted">{t('pin.enter')}</p>
            <div className="pin-dots" aria-label={t('pin.enter')} aria-live="polite">
              {Array.from({ length: Math.max(4, pin.length) }, (_, i) => <span key={i} className={i < pin.length ? 'dot on' : 'dot'} />)}
            </div>
            <div className="pin-pad" dir="ltr">
              {KEYS.map((k) => (
                <button key={k} type="button" className={k === 'ok' ? 'primary' : ''} disabled={busy || (k === 'ok' && pin.length < 4)}
                  aria-label={k === '⌫' ? 'Backspace' : k === 'ok' ? t('pin.ok') : k} onClick={() => press(k)}>
                  {k === 'ok' ? t('pin.ok') : k}
                </button>
              ))}
            </div>
            {users.length > 1 && <button className="ghost" onClick={() => setUser(null)}>{t('pin.back')}</button>}
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  )
}
