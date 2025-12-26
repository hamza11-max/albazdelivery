"use client"

import { useEffect } from 'react'

// Minimal IndexedDB-based request queue for offline POSTs
const DB_NAME = 'albaz-offline-queue'
const STORE_NAME = 'requests'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function enqueueRequest(item: any) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const r = store.add({ ...item, timestamp: Date.now() })
    r.onsuccess = () => resolve((r.result))
    r.onerror = () => reject(r.error)
  })
}

async function getAllQueued() {
  const db = await openDb()
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const r = store.getAll()
    r.onsuccess = () => resolve(r.result || [])
    r.onerror = () => reject(r.error)
  })
}

async function removeItem(id: number) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const r = store.delete(id)
    r.onsuccess = () => resolve(true)
    r.onerror = () => reject(r.error)
  })
}

async function processQueue() {
  try {
    const items = await getAllQueued()
    for (const it of items) {
      try {
        const res = await fetch(it.url, {
          method: it.method,
          headers: it.headers || {},
          body: it.body ? JSON.parse(it.body) : undefined,
        })
        if (res && res.ok) {
          await removeItem(it.id)
        }
      } catch (e) {
        // keep item in queue
      }
    }
  } catch (e) {
    console.warn('[OfflineQueue] process error', e)
  }
}

// Expose a small helper on window so app code can enqueue failed requests
function attachGlobalHelpers() {
  ;(window as any).__AlbazOffline = {
    enqueue: async (req: { url: string; method: string; headers?: any; body?: any }) => {
      try {
        await enqueueRequest({ url: req.url, method: req.method, headers: req.headers ? JSON.stringify(req.headers) : undefined, body: req.body ? JSON.stringify(req.body) : undefined })
        return true
      } catch (e) {
        console.warn('[OfflineQueue] enqueue failed', e)
        return false
      }
    },
    processQueue,
    stats: async () => {
      const items = await getAllQueued()
      return { pending: items.length }
    }
  }
}

export default function OfflineInitializer() {
  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('[SW] Registered')
      }).catch((e) => console.warn('[SW] Register failed', e))
    }

    attachGlobalHelpers()

    // Try to process queue when online
    const onOnline = () => {
      processQueue()
    }
    window.addEventListener('online', onOnline)
    // Attempt to process at startup
    processQueue()

    return () => {
      window.removeEventListener('online', onOnline)
    }
  }, [])

  return null
}
