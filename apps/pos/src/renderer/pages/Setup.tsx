import { useState } from 'react'

import { call } from '../api'
import { useI18n } from '../i18n'

const onlyDigits = (s: string) => s.replace(/[^\d]/g, '').slice(0, 6)

export function Setup({ onDone }: { onDone: () => void }) {
  const { t, lang, setLang, errorText } = useI18n()
  const [form, setForm] = useState({ shopName: '', phone: '', address: '', ownerName: '', pin: '', pinConfirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (form.pin !== form.pinConfirm) return setError(t('setup.pinMismatch'))
    setBusy(true)
    setError(null)
    try {
      await call('auth:setup', { shopName: form.shopName, phone: form.phone, address: form.address, lang, ownerName: form.ownerName, pin: form.pin })
      onDone()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <main className="center-screen">
      <form className="card setup" onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <div className="lang-switch" role="group">
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => void setLang('ar')}>العربية</button>
          <button type="button" aria-pressed={lang === 'fr'} onClick={() => void setLang('fr')}>Français</button>
        </div>
        <h1>{t('setup.title')}</h1>
        <p className="muted">{t('setup.help')}</p>
        <div className="fields">
          <label>{t('setup.shopName')}<input required autoFocus maxLength={80} value={form.shopName} onChange={(e) => set('shopName', e.target.value)} /></label>
          <label>{t('setup.phone')}<input inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label>
          <label>{t('setup.address')}<input maxLength={160} value={form.address} onChange={(e) => set('address', e.target.value)} /></label>
          <label>{t('setup.ownerName')}<input required maxLength={40} value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} /></label>
          <label>{t('setup.pin')}<input required type="password" inputMode="numeric" autoComplete="new-password" minLength={4} value={form.pin} onChange={(e) => set('pin', onlyDigits(e.target.value))} /></label>
          <label>{t('setup.pinConfirm')}<input required type="password" inputMode="numeric" autoComplete="new-password" minLength={4} value={form.pinConfirm} onChange={(e) => set('pinConfirm', onlyDigits(e.target.value))} /></label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary big" disabled={busy}>{t('setup.start')}</button>
      </form>
    </main>
  )
}
