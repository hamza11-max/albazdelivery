"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Switch } from "@/root/components/ui/switch"
import { Label } from "@/root/components/ui/label"
import { Badge } from "@/root/components/ui/badge"
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff } from "lucide-react"
import { getCloudSyncManager, type SyncStatus } from \"@/utils/cloudSyncUtils"
import { useToast } from "@/hooks/use-toast"

interface CloudSyncTabProps {
  translate: (fr: string, ar: string) => string
  vendorId?: string
}

export function CloudSyncTab({ translate, vendorId }: CloudSyncTabProps) {
  const { toast } = useToast()
  const [syncManager] = useState(() => getCloudSyncManager('/api', vendorId))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus())
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('vendor-auto-sync-enabled') === 'true'
  })
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getStatus())
    }, 2000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [syncManager])

  useEffect(() => {
    if (autoSyncEnabled && isOnline) {
      syncManager.startAutoSync(5 * 60 * 1000) // 5 minutes
    } else {
      syncManager.stopAutoSync()
    }
    return () => {
      syncManager.stopAutoSync()
    }
  }, [autoSyncEnabled, isOnline, syncManager])

  const handleManualSync = useCallback(async () => {
    const result = await syncManager.syncToCloud()
    setSyncStatus(syncManager.getStatus())
    
    if (result.success) {
      toast({
        title: translate("Synchronisation réussie", "تمت المزامنة بنجاح"),
        description: translate("Toutes les données ont été synchronisées avec le cloud", "تمت مزامنة جميع البيانات مع السحابة"),
      })
    } else {
      toast({
        title: translate("Erreur de synchronisation", "خطأ في المزامنة"),
        description: result.message,
        variant: "destructive",
      })
    }
  }, [syncManager, toast, translate])

  const handleSyncFromCloud = useCallback(async () => {
    const result = await syncManager.syncFromCloud()
    setSyncStatus(syncManager.getStatus())
    
    if (result.success) {
      toast({
        title: translate("Synchronisation réussie", "تمت المزامنة بنجاح"),
        description: translate("Les données ont été récupérées du cloud", "تم استرجاع البيانات من السحابة"),
      })
      // Reload page to reflect synced data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      toast({
        title: translate("Erreur de synchronisation", "خطأ في المزامنة"),
        description: result.message,
        variant: "destructive",
      })
    }
  }, [syncManager, toast, translate])

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled)
    localStorage.setItem('vendor-auto-sync-enabled', enabled.toString())
    
    if (enabled && isOnline) {
      syncManager.startAutoSync(5 * 60 * 1000)
      toast({
        title: translate("Synchronisation automatique activée", "تم تفعيل المزامنة التلقائية"),
        description: translate("Les données seront synchronisées toutes les 5 minutes", "سيتم مزامنة البيانات كل 5 دقائق"),
      })
    } else {
      syncManager.stopAutoSync()
      toast({
        title: translate("Synchronisation automatique désactivée", "تم إلغاء تفعيل المزامنة التلقائية"),
      })
    }
  }

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return translate("Jamais", "أبداً")
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return translate("À l'instant", "الآن")
      if (diffMins < 60) return translate(`Il y a ${diffMins} min`, `منذ ${diffMins} دقيقة`)
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return translate(`Il y a ${diffHours}h`, `منذ ${diffHours} ساعة`)
      return date.toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Synchronisation Cloud", "المزامنة السحابية")}</h2>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            {translate("État de la connexion", "حالة الاتصال")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {translate("Statut Internet", "حالة الإنترنت")}
              </p>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? translate("En ligne", "متصل") : translate("Hors ligne", "غير متصل")}
              </Badge>
            </div>
            {syncStatus.lastSync && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">
                  {translate("Dernière sync", "آخر مزامنة")}
                </p>
                <p className="text-sm font-semibold">{formatLastSync(syncStatus.lastSync)}</p>
              </div>
            )}
          </div>
          {syncStatus.syncError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    {translate("Erreur", "خطأ")}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{syncStatus.syncError}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            {translate("Synchronisation automatique", "المزامنة التلقائية")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync" className="text-base">
                {translate("Activer la synchronisation automatique", "تفعيل المزامنة التلقائية")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {translate("Synchroniser automatiquement toutes les 5 minutes", "مزامنة تلقائية كل 5 دقائق")}
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSyncEnabled}
              onCheckedChange={handleToggleAutoSync}
              disabled={!isOnline}
            />
          </div>
          {!isOnline && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {translate("La synchronisation automatique nécessite une connexion Internet", "المزامنة التلقائية تتطلب اتصالاً بالإنترنت")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            {translate("Synchronisation manuelle", "المزامنة اليدوية")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {translate(
              "Synchronisez manuellement vos données avec le cloud. Vous pouvez synchroniser vers le cloud ou récupérer les données du cloud.",
              "قم بمزامنة بياناتك يدوياً مع السحابة. يمكنك المزامنة إلى السحابة أو استرجاع البيانات من السحابة."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleManualSync}
              disabled={!isOnline || syncStatus.isSyncing}
              className="flex-1"
            >
              {syncStatus.isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {translate("Synchronisation...", "جاري المزامنة...")}
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  {translate("Synchroniser vers le cloud", "مزامنة إلى السحابة")}
                </>
              )}
            </Button>
            <Button
              onClick={handleSyncFromCloud}
              disabled={!isOnline || syncStatus.isSyncing}
              variant="outline"
              className="flex-1"
            >
              <CloudOff className="w-4 h-4 mr-2" />
              {translate("Récupérer du cloud", "استرجاع من السحابة")}
            </Button>
          </div>
          {syncStatus.pendingChanges > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {translate("Vous avez des modifications en attente de synchronisation", "لديك تعديلات في انتظار المزامنة")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {translate("Informations", "معلومات")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Cloud className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{translate("Les données synchronisées incluent : ventes, produits, personnel, coupons et paramètres", "البيانات المتزامنة تشمل: المبيعات والمنتجات والموظفين والكوبونات والإعدادات")}</span>
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{translate("La synchronisation automatique fonctionne uniquement lorsque vous êtes en ligne", "المزامنة التلقائية تعمل فقط عندما تكون متصلاً بالإنترنت")}</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{translate("En cas de conflit, les données locales sont prioritaires", "في حالة التعارض، تكون البيانات المحلية أولوية")}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

