import { useCallback, useEffect, useState } from 'react'

import type { Role, UserSummary } from '../../shared/ipc'
import { call } from '../api'
import { useAuth } from '../auth'
import { useI18n, type MessageKey } from '../i18n'

interface Draft {
  id?: string
  name: string
  role: Role
  pin: string
}

/** Owner-only user management: add cashiers, change roles, reset PINs, deactivate. */
export function Users() {
  const { t, errorText } = useI18n()
  const { session, refresh } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => call('users:list').then(setUsers, (err) => setError(errorText(err))), [errorText])
  useEffect(() => void load(), [load])

  async function act(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      await load()
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <div className="users">
      <table className="grid compact">
        <thead><tr><th>{t('users.name')}</th><th>{t('users.role')}</th><th /></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={u.isActive ? '' : 'inactive'}>
              <td>{u.name}{!u.isActive && <span className="muted small"> ({t('users.inactive')})</span>}</td>
              <td>{t(`role.${u.role}` as MessageKey)}</td>
              <td className="row-actions">
                <button className="small" onClick={() => setDraft({ id: u.id, name: u.name, role: u.role, pin: '' })}>{t('users.edit')}</button>
                {u.id !== session.userId && (
                  <button className="small ghost" onClick={() => act(() => call('users:setActive', { id: u.id, active: !u.isActive }))}>
                    {u.isActive ? t('users.deactivate') : t('users.activate')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!draft && <button onClick={() => setDraft({ name: '', role: 'CASHIER', pin: '' })}>{t('users.add')}</button>}

      {draft && (
        <form className="fields user-form" onSubmit={(e) => {
          e.preventDefault()
          void act(async () => {
            await call('users:save', { ...(draft.id ? { id: draft.id } : {}), name: draft.name, role: draft.role, ...(draft.pin ? { pin: draft.pin } : {}) })
            setDraft(null)
            // Changing your own name or role changes what you may do: re-read the session.
            if (draft.id === session.userId) await refresh()
          })
        }}>
          <label>{t('users.name')}<input required autoFocus maxLength={40} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>
            {t('users.role')}
            <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}>
              <option value="CASHIER">{t('role.CASHIER')}</option>
              <option value="OWNER">{t('role.OWNER')}</option>
            </select>
          </label>
          <label>
            {draft.id ? t('users.newPin') : t('users.pin')}
            <input type="password" inputMode="numeric" autoComplete="new-password" required={!draft.id} minLength={4}
              value={draft.pin} onChange={(e) => setDraft({ ...draft, pin: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })} />
          </label>
          <div className="buttons">
            <button type="button" onClick={() => setDraft(null)}>{t('common.cancel')}</button>
            <button type="submit" className="primary">{t('common.save')}</button>
          </div>
        </form>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
