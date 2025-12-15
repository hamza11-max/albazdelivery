"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Badge } from "@/root/components/ui/badge"
import { Download, Upload, Database, Clock, History, AlertCircle, CheckCircle2 } from "lucide-react"
import { createBackup, restoreBackup, downloadBackup, uploadBackup, getBackupInfo, saveBackupHistory, type BackupData } from "@/utils/backupUtils"
import { useToast } from "@/hooks/use-toast"

interface BackupTabProps {
  translate: (fr: string, ar: string) => string
}

export function BackupTab({ translate }: BackupTabProps) {
  const { toast } = useToast()
  const [backupInfo, setBackupInfo] = useState(getBackupInfo())
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    setBackupInfo(getBackupInfo())
  }, [])

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
        // Trigger page reload to reflect restored data
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return translate("Jamais", "أبداً")
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Sauvegarde & Restauration", "النسخ الاحتياطي والاستعادة")}</h2>

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
    </div>
  )
}

