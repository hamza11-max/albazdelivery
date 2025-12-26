import React, { useEffect, useState } from 'react'

type Stats = {
  queued?: number
  lastProcessed?: number | null
}

export default function OfflineStatus() {
  const [stats, setStats] = useState<Stats>({ queued: 0, lastProcessed: null })
  const [processing, setProcessing] = useState(false)

  async function refresh() {
    try {
      // window.__AlbazOffline is registered by OfflineInitializer
      // Use duck-typing to avoid crashes in web-only environments
      const offline = (globalThis as any).__AlbazOffline
      if (!offline || typeof offline.stats !== 'function') return
      const s = await offline.stats()
      setStats({ queued: s?.queueLength ?? 0, lastProcessed: s?.lastProcessed ?? null })
    } catch (e) {
      console.warn('OfflineStatus refresh error', e)
    }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15000)
    return () => clearInterval(id)
  }, [])

  async function handleSync() {
    try {
      const offline = (globalThis as any).__AlbazOffline
      if (!offline || typeof offline.processQueue !== 'function') return
      setProcessing(true)
      await offline.processQueue()
      await refresh()
    } catch (e) {
      console.error('OfflineStatus sync error', e)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 84, zIndex: 9999 }}>
      <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 12, color: '#374151' }}>Offline Queue</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div style={{ fontWeight: 600 }}>{stats.queued ?? 0}</div>
          <button onClick={handleSync} disabled={processing || (stats.queued ?? 0) === 0} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: processing ? '#9CA3AF' : '#0ea5a4', color: 'white', cursor: 'pointer' }}>
            {processing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
