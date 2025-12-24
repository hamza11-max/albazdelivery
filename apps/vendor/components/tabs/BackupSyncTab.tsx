"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Badge } from "@/root/components/ui/badge"
import { Switch } from "@/root/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { 
  Download, 
  Upload, 
  Database, 
  Clock, 
  History, 
  AlertCircle, 
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react"
import { createBackup, restoreBackup, downloadBackup, uploadBackup, getBackupInfo, saveBackupHistory, type BackupData } from "../../utils/backupUtils"
import { getCloudSyncManager, type SyncStatus } from "../../utils/cloudSyncUtils"
import { useToast } from "@/root/hooks/use-toast"

interface BackupSyncTabProps {
  translate: (fr: string, ar: string) => string
  vendorId?: string
}

export function BackupSyncTab({ translate, vendorId }: BackupSyncTabProps) {
  const { toast } = useToast()
  
  // Backup state
  const [backupInfo, setBackupInfo] = useState(getBackupInfo())
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Cloud sync state
  const [syncManager] = useState(() => getCloudSyncManager('/api', vendorId))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus())
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('vendor-auto-sync-enabled') === 'true'
  })
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    setBackupInfo(getBackupInfo())
  }, [])

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

  // Backup handlers
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const backupData = createBackup()
      saveBackupHistory(backupData)
      downloadBackup(backupData)
      setBackupInfo(getBackupInfo())
      toast({
        title: translate("Sauvegarde créée", "تم إنشاء النسخة الاحتياطية"),
        description: translate("La sauvegarde a été téléchargée avec succès", "تم تنزيل النسخة الاحتياطية بنجاح"),
      })
    } catch (error) {
      toast({
        title: translate("Erreur", "خطأ"),
        description: translate("Échec de la création de la sauvegarde", "فشل إنشاء النسخة الاحتياطية"),
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file)
      } else {
        toast({
          title: translate("Fichier invalide", "ملف غير صالح"),
          description: translate("Veuillez sélectionner un fichier JSON", "يرجى اختيار ملف JSON"),
          variant: "destructive",
        })
        setSelectedFile(null)
      }
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast({
        title: translate("Aucun fichier sélectionné", "لم يتم اختيار ملف"),
        description: translate("Veuillez sélectionner un fichier de sauvegarde", "يرجى اختيار ملف النسخة الاحتياطية"),
        variant: "destructive",
      })
      return
    }

    setIsRestoring(true)
    try {
      const backupData = await uploadBackup(selectedFile)
      const result = restoreBackup(backupData)
      
      if (result.success) {
        toast({
          title: translate("Sauvegarde restaurée", "تم استعادة النسخة الاحتياطية"),
          description: translate("Toutes les données ont été restaurées avec succès", "تم استعادة جميع البيانات بنجاح"),
        })
        setBackupInfo(getBackupInfo())
        setSelectedFile(null)
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: translate("Erreur de restauration", "خطأ في الاستعادة"),
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: translate("Erreur", "خطأ"),
        description: translate("Échec de la restauration de la sauvegarde", "فشل استعادة النسخة الاحتياطية"),
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  // Cloud sync handlers
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return translate("Jamais", "أبداً")
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
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
      <h2 className="text-2xl font-bold">{translate("Sauvegarde & Synchronisation", "النسخ الاحتياطي والمزامنة")}</h2>

      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backup">{translate("Sauvegarde", "النسخ الاحتياطي")}</TabsTrigger>
          <TabsTrigger value="sync">{translate("Synchronisation", "المزامنة")}</TabsTrigger>
        </TabsList>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6 mt-6">
          {/* Backup Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {translate("Informations de sauvegarde", "معلومات النسخ الاحتياطي")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">{translate("Dernière sauvegarde", "آخر نسخة احتياطية")}</Label>
                  <p className="text-lg font-semibold">{formatDate(backupInfo.lastBackup)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{translate("Nombre de sauvegardes", "عدد النسخ الاحتياطية")}</Label>
                  <p className="text-lg font-semibold">{backupInfo.backupCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {translate("Créer une sauvegarde", "إنشاء نسخة احتياطية")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {translate(
                  "Créez une sauvegarde complète de toutes vos données : ventes, produits, clients, fournisseurs, personnel, coupons et paramètres.",
                  "أنشئ نسخة احتياطية كاملة لجميع بياناتك: المبيعات والمنتجات والعملاء والموردين والموظفين والكوبونات والإعدادات."
                )}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {translate("Recommandation", "توصية")}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {translate(
                        "Créez des sauvegardes régulières pour protéger vos données. Nous recommandons une sauvegarde quotidienne ou hebdomadaire.",
                        "أنشئ نسخاً احتياطية منتظمة لحماية بياناتك. نوصي بعمل نسخة احتياطية يومية أو أسبوعية."
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleCreateBackup} 
                disabled={isCreatingBackup}
                className="w-full md:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                {isCreatingBackup 
                  ? translate("Création en cours...", "جاري الإنشاء...") 
                  : translate("Créer une sauvegarde", "إنشاء نسخة احتياطية")}
              </Button>
            </CardContent>
          </Card>

          {/* Restore Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {translate("Restaurer une sauvegarde", "استعادة نسخة احتياطية")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                      {translate("Attention", "تحذير")}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {translate(
                        "La restauration remplacera toutes les données actuelles. Assurez-vous de créer une sauvegarde avant de restaurer.",
                        "الاستعادة ستحل محل جميع البيانات الحالية. تأكد من إنشاء نسخة احتياطية قبل الاستعادة."
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-file">{translate("Sélectionner un fichier de sauvegarde", "اختر ملف النسخة الاحتياطية")}</Label>
                  <Input
                    id="backup-file"
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleRestoreBackup} 
                  disabled={!selectedFile || isRestoring}
                  variant="destructive"
                  className="w-full md:w-auto"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isRestoring 
                    ? translate("Restauration en cours...", "جاري الاستعادة...") 
                    : translate("Restaurer la sauvegarde", "استعادة النسخة الاحتياطية")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                {translate("Conseils de sauvegarde", "نصائح النسخ الاحتياطي")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{translate("Effectuez des sauvegardes régulières (quotidiennes ou hebdomadaires)", "قم بعمل نسخ احتياطية منتظمة (يومية أو أسبوعية)")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Database className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{translate("Stockez vos sauvegardes dans un emplacement sûr (cloud, disque externe)", "احفظ النسخ الاحتياطية في مكان آمن (السحابة، القرص الخارجي)")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{translate("Testez vos sauvegardes périodiquement pour vous assurer qu'elles fonctionnent", "اختبر النسخ الاحتياطية بانتظام للتأكد من عملها")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{translate("Ne supprimez jamais vos sauvegardes avant d'avoir vérifié qu'une nouvelle fonctionne", "لا تحذف النسخ الاحتياطية أبداً قبل التأكد من عمل نسخة جديدة")}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloud Sync Tab */}
        <TabsContent value="sync" className="space-y-6 mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}




