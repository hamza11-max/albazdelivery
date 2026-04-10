"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, RefreshCw, Rocket } from "lucide-react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/root/components/ui/card"
import { Progress } from "@/root/components/ui/progress"
import type { AppUpdateStatusPayload } from "@/lib/electron-api"

type ToastFn = (options: {
  title: string
  description?: string
  variant?: "default" | "destructive"
}) => void

type Phase =
  | "idle"
  | "checking"
  | "uptodate"
  | "available"
  | "downloading"
  | "downloaded"
  | "error"
  | "no-updater"

type UpdateChannel = "latest" | "beta"

interface AppUpdateCardProps {
  translate: (fr: string, ar: string) => string
  toast: ToastFn
}

export function AppUpdateCard({ translate, toast }: AppUpdateCardProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [installedVersion, setInstalledVersion] = useState<string>("—")
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null)
  const [downloadPercent, setDownloadPercent] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [channel, setChannel] = useState<UpdateChannel>("latest")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const api = typeof window !== "undefined" ? window.electronAPI : undefined
      if (!api?.getVersion) return
      try {
        const v = await api.getVersion()
        if (!cancelled) setInstalledVersion(v || "—")
      } catch {
        if (!cancelled) setInstalledVersion("—")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const updater = typeof window !== "undefined" ? window.electronAPI?.updater : undefined
    if (!updater?.getChannel) return
    ;(async () => {
      try {
        const result = await updater.getChannel()
        if (result?.channel === "beta" || result?.channel === "latest") {
          setChannel(result.channel)
        }
      } catch {
        // Keep default stable channel.
      }
    })()
  }, [])

  useEffect(() => {
    const api = typeof window !== "undefined" ? window.electronAPI?.updater : undefined
    if (!api?.onStatus) return

    const handle = (payload: AppUpdateStatusPayload) => {
      const { status } = payload
      if (status === "checking") {
        setPhase("checking")
        setStatusMessage("")
        return
      }
      if (status === "not-available") {
        setPhase("uptodate")
        setRemoteVersion(null)
        setStatusMessage("")
        return
      }
      if (status === "available") {
        setPhase("available")
        const v = (payload as { version?: string }).version
        setRemoteVersion(v || null)
        setStatusMessage("")
        return
      }
      if (status === "downloading") {
        setPhase("downloading")
        const p = typeof payload.percent === "number" ? payload.percent : 0
        setDownloadPercent(p)
        return
      }
      if (status === "downloaded") {
        setPhase("downloaded")
        const v = (payload as { version?: string }).version
        if (v) setRemoteVersion(v)
        setDownloadPercent(100)
        return
      }
      if (status === "error") {
        setPhase("error")
        setStatusMessage((payload as { message?: string }).message || translate("Erreur inconnue", "خطأ غير معروف"))
      }
    }

    const off = api.onStatus(handle)
    return () => off()
  }, [translate])

  const runCheck = useCallback(async () => {
    const api = window.electronAPI
    if (!api?.updater?.check) {
      setPhase("no-updater")
      return
    }

    setPhase("checking")
    setStatusMessage("")

    try {
      const health = api.getHealth ? await api.getHealth() : null
      if (health?.env?.isDev) {
        setPhase("no-updater")
        toast({
          title: translate("Mode développement", "وضع التطوير"),
          description: translate(
            "Les mises à jour automatiques ne sont disponibles que dans l'application installée (Windows / macOS).",
            "التحديثات التلقائية متاحة فقط في التطبيق المثبت (ويندوز / ماك)."
          ),
        })
        return
      }

      const result = await api.updater.check()
      if (result?.error || result?.message) {
        const msg = result.error || result.message || ""
        if (msg.includes("not available") || msg.includes("development")) {
          setPhase("no-updater")
          return
        }
        setPhase("error")
        setStatusMessage(msg)
        return
      }

      if (result?.available && result?.info?.version) {
        setPhase("available")
        setRemoteVersion(result.info.version)
      }
      // If no explicit available flag, events from main process will set phase
    } catch (e) {
      setPhase("error")
      setStatusMessage(e instanceof Error ? e.message : String(e))
    }
  }, [toast, translate])

  const runDownload = useCallback(async () => {
    const api = window.electronAPI?.updater
    if (!api?.download) return
    setPhase("downloading")
    setDownloadPercent(0)
    try {
      const result = await api.download()
      if (result && result.success === false && result.error) {
        setPhase("error")
        setStatusMessage(result.error)
        toast({
          title: translate("Échec du téléchargement", "فشل التنزيل"),
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (e) {
      setPhase("error")
      const msg = e instanceof Error ? e.message : String(e)
      setStatusMessage(msg)
      toast({
        title: translate("Échec du téléchargement", "فشل التنزيل"),
        description: msg,
        variant: "destructive",
      })
    }
  }, [toast, translate])

  const runInstall = useCallback(() => {
    window.electronAPI?.updater?.install?.()
  }, [])

  const handleChannelChange = useCallback(
    async (nextChannel: UpdateChannel) => {
      const updater = window.electronAPI?.updater
      if (!updater?.setChannel) return
      try {
        const result = await updater.setChannel(nextChannel)
        if (result?.success) {
          setChannel(nextChannel)
          toast({
            title: translate("Canal de mise à jour modifié", "تم تغيير قناة التحديث"),
            description:
              nextChannel === "beta"
                ? translate("Canal Bêta activé.", "تم تفعيل القناة التجريبية.")
                : translate("Canal Stable activé.", "تم تفعيل القناة المستقرة."),
          })
        }
      } catch (e) {
        toast({
          title: translate("Impossible de changer le canal", "تعذر تغيير القناة"),
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive",
        })
      }
    },
    [toast, translate]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          {translate("Mises à jour de l'application", "تحديثات التطبيق")}
        </CardTitle>
        <CardDescription>
          {translate(
            "Vérifiez et installez les nouvelles versions publiées sur GitHub.",
            "تحقق من الإصدارات الجديدة المنشورة على GitHub وتثبيتها."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{translate("Version installée", "الإصدار المثبت")}</span>
          {": "}
          {installedVersion}
        </p>

        <div className="space-y-1">
          <p className="text-sm font-medium">{translate("Canal de mise à jour", "قناة التحديث")}</p>
          <div className="flex gap-2">
            <Button
              variant={channel === "latest" ? "default" : "outline"}
              size="sm"
              onClick={() => handleChannelChange("latest")}
            >
              {translate("Stable", "مستقر")}
            </Button>
            <Button
              variant={channel === "beta" ? "default" : "outline"}
              size="sm"
              onClick={() => handleChannelChange("beta")}
            >
              Beta
            </Button>
          </div>
        </div>

        {phase === "no-updater" && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {translate(
              "Les mises à jour ne sont pas disponibles en développement ou si le module est désactivé. Utilisez l’installateur officiel.",
              "التحديثات غير متاحة في وضع التطوير. استخدم مثبت التطبيق الرسمي."
            )}
          </p>
        )}

        {phase === "uptodate" && (
          <p className="text-sm text-muted-foreground">
            {translate("Vous utilisez la dernière version disponible.", "أنت تستخدم أحدث إصدار متاح.")}
          </p>
        )}

        {phase === "available" && remoteVersion && (
          <p className="text-sm font-medium">
            {translate(`Nouvelle version ${remoteVersion} disponible`, `يتوفر إصدار جديد ${remoteVersion}`)}
          </p>
        )}

        {phase === "downloading" && (
          <div className="space-y-2">
            <p className="text-sm">
              {translate("Téléchargement…", "جاري التنزيل…")} {Math.round(downloadPercent)}%
            </p>
            <Progress value={downloadPercent} className="h-2" />
          </div>
        )}

        {phase === "downloaded" && (
          <p className="text-sm text-muted-foreground">
            {translate(
              "Mise à jour téléchargée. Redémarrez l’application pour terminer l’installation.",
              "تم تنزيل التحديث. أعد تشغيل التطبيق لإكمال التثبيت."
            )}
          </p>
        )}

        {phase === "error" && statusMessage && (
          <p className="text-sm text-destructive">{statusMessage}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={runCheck} disabled={phase === "checking" || phase === "downloading"}>
            <RefreshCw className={`w-4 h-4 mr-2 ${phase === "checking" ? "animate-spin" : ""}`} />
            {phase === "checking"
              ? translate("Vérification…", "جاري التحقق…")
              : translate("Vérifier les mises à jour", "التحقق من التحديثات")}
          </Button>

          {phase === "available" && (
            <Button onClick={runDownload}>
              <Download className="w-4 h-4 mr-2" />
              {translate("Télécharger", "تنزيل")}
            </Button>
          )}

          {phase === "downloaded" && (
            <Button onClick={runInstall}>
              <Rocket className="w-4 h-4 mr-2" />
              {translate("Installer et redémarrer", "تثبيت وإعادة التشغيل")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
