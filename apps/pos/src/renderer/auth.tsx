import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import type { Session } from '../shared/ipc'
import { call } from './api'

interface Auth {
  session: Session
  shopName: string
  isOwner: boolean
  /** Locks the till: back to the PIN screen. */
  lock: () => Promise<void>
  /** Re-reads the session from the main process (e.g. after changing your own role). */
  refresh: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside the signed-in app')
  return ctx
}

type State =
  | { kind: 'loading' }
  | { kind: 'setup' }
  | { kind: 'signin'; shopName: string }
  | { kind: 'in'; shopName: string; session: Session }

/**
 * Decides what to show: first-run setup, the PIN screen, or the app.
 * The main process holds the real session; this only mirrors it.
 */
export function AuthGate(props: {
  setup: (done: () => void) => ReactNode
  signIn: (shopName: string, done: () => void) => ReactNode
  children: ReactNode
}) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  const refresh = useCallback(async () => {
    const s = await call('auth:status')
    if (!s.setupDone) setState({ kind: 'setup' })
    else if (!s.session) setState({ kind: 'signin', shopName: s.shopName ?? '' })
    else setState({ kind: 'in', shopName: s.shopName ?? '', session: s.session })
  }, [])

  useEffect(() => void refresh(), [refresh])

  const lock = useCallback(async () => {
    await call('auth:logout')
    await refresh()
  }, [refresh])

  if (state.kind === 'loading') return null
  if (state.kind === 'setup') return <>{props.setup(() => void refresh())}</>
  if (state.kind === 'signin') return <>{props.signIn(state.shopName, () => void refresh())}</>
  return (
    <AuthContext.Provider value={{ session: state.session, shopName: state.shopName, isOwner: state.session.role === 'OWNER', lock, refresh }}>
      {props.children}
    </AuthContext.Provider>
  )
}
