"use client"

import { useEffect, useMemo, useState } from "react"

type UpdateUiState = "idle" | "updateAvailable" | "downloading" | "downloaded"

const REMIND_LATER_KEY = "desktop.updater.remindLaterAt"
const REMIND_LATER_HOURS = 6

function shouldDeferPrompt() {
  if (typeof window === "undefined") return false
  const raw = window.localStorage.getItem(REMIND_LATER_KEY)
  if (!raw) return false
  const remindAt = Number(raw)
  if (!Number.isFinite(remindAt)) return false
  return Date.now() < remindAt
}

function setRemindLater(hours = REMIND_LATER_HOURS) {
  if (typeof window === "undefined") return
  const next = Date.now() + hours * 60 * 60 * 1000
  window.localStorage.setItem(REMIND_LATER_KEY, String(next))
}

export function UpdaterModal() {
  const [state, setState] = useState<UpdateUiState>("idle")
  const [isReady, setIsReady] = useState(false)
  const [version, setVersion] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const api = window.electronAPI
      if (!api?.updater?.check) return

      const health = await api.getHealth?.()
      if (health?.env?.isDev) return

      if (shouldDeferPrompt()) return

      await api.updater.check()
      if (mounted) setIsReady(true)
    }

    run().catch(() => {
      // Ignore transient check failures; settings card still allows manual checks.
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const updater = window.electronAPI?.updater
    if (!updater) return

    const offAvailable = updater.onUpdateAvailable?.((payload) => {
      setVersion(payload?.version || null)
      setState("updateAvailable")
      setIsReady(true)
    })

    const offProgress = updater.onProgress?.((payload) => {
      setProgress(typeof payload?.percent === "number" ? payload.percent : 0)
      setState("downloading")
      setIsReady(true)
    })

    const offDownloaded = updater.onDownloaded?.((payload) => {
      setVersion((prev) => payload?.version || prev)
      setProgress(100)
      setState("downloaded")
      setIsReady(true)
    })

    return () => {
      offAvailable?.()
      offProgress?.()
      offDownloaded?.()
    }
  }, [])

  const isVisible = useMemo(() => isReady && state !== "idle", [isReady, state])
  if (!isVisible) return null

  const onDownload = () => {
    setState("downloading")
    setProgress(0)
    window.electronAPI?.updater?.startDownload?.()
  }

  const onInstall = () => {
    window.electronAPI?.updater?.installUpdate?.()
  }

  const onRemindLater = () => {
    setRemindLater()
    window.electronAPI?.updater?.remindLater?.()
    setState("idle")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
        {state === "updateAvailable" && (
          <>
            <h2 className="text-lg font-semibold">Update Available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A new version is ready to download{version ? ` (${version})` : "."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onDownload}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Download
              </button>
              <button
                type="button"
                onClick={onRemindLater}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Remind me later
              </button>
            </div>
          </>
        )}

        {state === "downloading" && (
          <>
            <h2 className="text-lg font-semibold">Downloading Update</h2>
            <p className="mt-2 text-sm text-muted-foreground">{Math.round(progress)}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
          </>
        )}

        {state === "downloaded" && (
          <>
            <h2 className="text-lg font-semibold">Update Ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The update has been downloaded and is ready to install.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onInstall}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Restart &amp; Install
              </button>
              <button
                type="button"
                onClick={onRemindLater}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
