"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Switch } from "@/root/components/ui/switch"
import { Label } from "@/root/components/ui/label"
import { Input } from "@/root/components/ui/input"
import { Badge } from "@/root/components/ui/badge"
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Database,
  Inbox,
} from "lucide-react"
import { getCloudSyncManager, type SyncStatus } from "../../utils/cloudSyncUtils"
import { createBackup, restoreBackup, downloadBackup, uploadBackup, getBackupInfo, saveBackupHistory } from "../../utils/backupUtils"
import { useToast } from "@/root/hooks/use-toast"

interface SyncSaveTabProps {
  translate: (fr: string, ar: string) => string
  vendorId?: string
}

export function SyncSaveTab({ translate, vendorId }: SyncSaveTabProps) {
  const { toast } = useToast()
  const [syncManager] = useState(() => getCloudSyncManager("/api", vendorId))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus())
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => localStorage.getItem("vendor-auto-sync-enabled") === "true")
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [backupInfo, setBackupInfo] = useState(getBackupInfo())
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [offlinePendingCount, setOfflinePendingCount] = useState(0)
  const [isSyncingOffline, setIsSyncingOffline] = useState(false)
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI?.isElectron

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    const interval = setInterval(() => setSyncStatus(syncManager.getStatus()), 2000)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [syncManager])

  useEffect(() => {
    if (autoSyncEnabled && isOnline) syncManager.startAutoSync(5 * 60 * 1000)
    else syncManager.stopAutoSync()
    return () => syncManager.stopAutoSync()
  }, [autoSyncEnabled, isOnline, syncManager])

  const refreshOfflineCount = useCallback(() => {
    if (typeof window === "undefined") return
    if (isElectron && (window as any).electronAPI?.offline?.getStats) {
      (window as any).electronAPI.offline.getStats().then((stats: { pendingSales?: number }) => {
        setOfflinePendingCount(typeof stats?.pendingSales === "number" ? stats.pendingSales : 0)
      }).catch(() => setOfflinePendingCount(0))
    } else {
      try {
        const queued = JSON.parse(localStorage.getItem("offline-sales-queue") || "[]")
        setOfflinePendingCount(Array.isArray(queued) ? queued.length : 0)
      } catch {
        setOfflinePendingCount(0)
      }
    }
  }, [isElectron])

  useEffect(() => {
    refreshOfflineCount()
    const interval = setInterval(refreshOfflineCount, 3000)
    return () => clearInterval(interval)
  }, [refreshOfflineCount])

  const handleSyncOfflineQueue = useCallback(async () => {
    if (typeof window === "undefined") return
    setIsSyncingOffline(true)
    try {
      if (isElectron && (window as any).electronAPI?.offline?.syncNow) {
        const stats = await (window as any).electronAPI.offline.syncNow()
        setOfflinePendingCount(typeof stats?.pendingSales === "number" ? stats.pendingSales : 0)
        if (stats?.syncedSales > 0) {
          toast({ title: translate("Ventes synchronisées", "تمت مزامنة المبيعات"), description: translate(`${stats.syncedSales} vente(s) envoyée(s)`, "تم إرسال عملية البيع") })
          window.dispatchEvent(new CustomEvent("vendor-refresh-data"))
        }
      } else if (isOnline) {
        const queued = JSON.parse(localStorage.getItem("offline-sales-queue") || "[]")
        if (!Array.isArray(queued) || queued.length === 0) {
          setOfflinePendingCount(0)
          return
        }
        const remaining: any[] = []
        let synced = 0
        for (const entry of queued) {
          try {
            const res = await fetch(`/api/erp/sales${vendorId ? `?vendorId=${vendorId}` : ""}`, { method: "POST", body: JSON.stringify(entry.payload) })
            const data = await res.json()
            if (res.ok && data?.success) synced += 1
            else remaining.push(entry)
          } catch {
            remaining.push(entry)
          }
        }
        localStorage.setItem("offline-sales-queue", JSON.stringify(remaining))
        setOfflinePendingCount(remaining.length)
        if (synced > 0) {
          toast({ title: translate("Ventes synchronisées", "تمت مزامنة المبيعات"), description: translate(`${synced} vente(s) envoyée(s)`, "تم إرسال عملية البيع") })
          window.dispatchEvent(new CustomEvent("vendor-refresh-data"))
        }
      }
    } finally {
      setIsSyncingOffline(false)
    }
  }, [isElectron, isOnline, vendorId, toast, translate])

  const handleManualSync = useCallback(async () => {
    const result = await syncManager.syncToCloud()
    setSyncStatus(syncManager.getStatus())
    if (result.success) toast({ title: translate("Synchronisation réussie", "تمت المزامنة بنجاح"), description: translate("Toutes les données ont été synchronisées avec le cloud", "تمت مزامنة جميع البيانات مع السحابة") })
    else toast({ title: translate("Erreur de synchronisation", "خطأ في المزامنة"), description: result.message, variant: "destructive" })
  }, [syncManager, toast, translate])

  const handleSyncFromCloud = useCallback(async () => {
    const result = await syncManager.syncFromCloud()
    setSyncStatus(syncManager.getStatus())
    if (result.success) {
      toast({ title: translate("Synchronisation réussie", "تمت المزامنة بنجاح"), description: translate("Les données ont été récupérées du cloud", "تم استرجاع البيانات من السحابة") })
      setTimeout(() => window.location.reload(), 1000)
    } else toast({ title: translate("Erreur de synchronisation", "خطأ في المزامنة"), description: result.message, variant: "destructive" })
  }, [syncManager, toast, translate])

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled)
    localStorage.setItem("vendor-auto-sync-enabled", enabled.toString())
    if (enabled && isOnline) {
      syncManager.startAutoSync(5 * 60 * 1000)
      toast({ title: translate("Synchronisation automatique activée", "تم تفعيل المزامنة التلقائية") })
    } else {
      syncManager.stopAutoSync()
      toast({ title: translate("Synchronisation automatique désactivée", "تم إلغاء تفعيل المزامنة التلقائية") })
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const backupData = createBackup()
      saveBackupHistory(backupData)
      downloadBackup(backupData)
      setBackupInfo(getBackupInfo())
      toast({ title: translate("Sauvegarde créée", "تم إنشاء النسخة الاحتياطية"), description: translate("La sauvegarde a été téléchargée avec succès", "تم تنزيل النسخة الاحتياطية بنجاح") })
    } catch {
      toast({ title: translate("Erreur", "خطأ"), description: translate("Échec de la création de la sauvegarde", "فشل إنشاء النسخة الاحتياطية"), variant: "destructive" })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) setSelectedFile(file)
      else {
        toast({ title: translate("Fichier invalide", "ملف غير صالح"), description: translate("Veuillez sélectionner un fichier JSON", "يرجى اختيار ملف JSON"), variant: "destructive" })
        setSelectedFile(null)
      }
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast({ title: translate("Aucun fichier sélectionné", "لم يتم اختيار ملف"), variant: "destructive" })
      return
    }
    setIsRestoring(true)
    try {
      const backupData = await uploadBackup(selectedFile)
      const result = restoreBackup(backupData)
      if (result.success) {
        toast({ title: translate("Sauvegarde restaurée", "تم استعادة النسخة الاحتياطية") })
        setBackupInfo(getBackupInfo())
        setSelectedFile(null)
        setTimeout(() => window.location.reload(), 1000)
      } else toast({ title: translate("Erreur de restauration", "خطأ في الاستعادة"), description: result.message, variant: "destructive" })
    } catch {
      toast({ title: translate("Erreur", "خطأ"), variant: "destructive" })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return translate("Jamais", "أبداً")
    try {
      const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
      if (diffMins < 1) return translate("À l'instant", "الآن")
      if (diffMins < 60) return translate(`Il y a ${diffMins} min`, `منذ ${diffMins} دقيقة`)
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Sync & Sauvegarde", "المزامنة والنسخ الاحتياطي")}</h2>

      {/* Sync Cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
            {translate("Synchronisation Cloud", "المزامنة السحابية")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">{translate("Synchronisation automatique", "المزامنة التلقائية")}</Label>
              <p className="text-sm text-muted-foreground">{translate("Toutes les 5 minutes", "كل 5 دقائق")}</p>
            </div>
            <Switch id="auto-sync" checked={autoSyncEnabled} onCheckedChange={handleToggleAutoSync} disabled={!isOnline} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleManualSync} disabled={!isOnline || syncStatus.isSyncing} className="flex-1">
              {syncStatus.isSyncing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{translate("Synchronisation...", "جاري المزامنة...")}</> : <><Cloud className="w-4 h-4 mr-2" />{translate("Vers le cloud", "إلى السحابة")}</>}
            </Button>
            <Button onClick={handleSyncFromCloud} disabled={!isOnline || syncStatus.isSyncing} variant="outline" className="flex-1">
              <CloudOff className="w-4 h-4 mr-2" />
              {translate("Récupérer du cloud", "استرجاع من السحابة")}
            </Button>
          </div>
          {syncStatus.lastSync && <p className="text-sm text-muted-foreground">{translate("Dernière sync", "آخر مزامنة")}: {formatLastSync(syncStatus.lastSync)}</p>}
          {syncStatus.pendingChanges > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{translate("Modifications en attente", "تعديلات في انتظار المزامنة")}: {syncStatus.pendingChanges}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            {translate("File d'attente hors ligne", "قائمة الانتظار دون اتصال")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {translate("Ventes enregistrées hors ligne en attente d'envoi.", "المبيعات المحفوظة دون اتصال في انتظار الإرسال.")}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={offlinePendingCount > 0 ? "default" : "secondary"} className="text-sm">
              {offlinePendingCount} {translate("en attente", "في الانتظار")}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncOfflineQueue}
              disabled={!isOnline || offlinePendingCount === 0 || isSyncingOffline}
            >
              {isSyncingOffline ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {translate("Synchroniser maintenant", "مزامنة الآن")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save / Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {translate("Sauvegarde & Restauration", "النسخ الاحتياطي والاستعادة")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {translate("Dernière sauvegarde", "آخر نسخة احتياطية")}: {backupInfo.lastBackup ? new Date(backupInfo.lastBackup).toLocaleString() : translate("Jamais", "أبداً")} · {translate("Nombre", "العدد")}: {backupInfo.backupCount}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
              <Download className="w-4 h-4 mr-2" />
              {isCreatingBackup ? translate("Création...", "جاري الإنشاء...") : translate("Créer une sauvegarde", "إنشاء نسخة احتياطية")}
            </Button>
            <div className="flex items-center gap-2">
              <Input type="file" accept=".json,application/json" onChange={handleFileSelect} className="cursor-pointer w-auto max-w-[200px]" />
              <Button variant="destructive" onClick={handleRestoreBackup} disabled={!selectedFile || isRestoring}>
                <Upload className="w-4 h-4 mr-2" />
                {isRestoring ? translate("Restauration...", "جاري الاستعادة...") : translate("Restaurer", "استعادة")}
              </Button>
            </div>
          </div>
          {selectedFile && <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{selectedFile.name}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
