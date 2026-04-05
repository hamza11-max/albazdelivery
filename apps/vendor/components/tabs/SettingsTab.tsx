"use client"

import { useEffect, useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Textarea } from "@/root/components/ui/textarea"
import { Store, Receipt, Clock, Activity } from "lucide-react"
import { DayHoursInput } from "../DayHoursInput"

interface SettingsTabProps {
  isDarkMode: boolean
  language: string
  translate: (fr: string, ar: string) => string
  setIsDarkMode: (dark: boolean) => void
  setLanguage: (lang: string) => void
}

export function SettingsTab({
  isDarkMode,
  language,
  translate,
  setIsDarkMode,
  setLanguage,
}: SettingsTabProps) {
  const [health, setHealth] = useState<any | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadHealth() {
      try {
        if (typeof window === "undefined" || !(window as any).electronAPI?.getHealth) return
        const result = await (window as any).electronAPI.getHealth()
        if (!cancelled) {
          setHealth(result)
          setHealthError(null)
        }
      } catch (e: any) {
        if (!cancelled) {
          setHealthError(e?.message || "Unknown error")
        }
      }
    }
    loadHealth()
    const id = setInterval(loadHealth, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const moduleLabel = (ok: boolean | undefined) =>
    ok ? translate("OK", "جيد") : translate("Indisponible", "غير متوفر")

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Paramètres", "الإعدادات")}</h2>

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {translate("Informations de la boutique", "معلومات المتجر")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{translate("Nom de la boutique", "اسم المتجر")}</Label>
              <Input 
                placeholder={translate("Entrez le nom de votre boutique", "أدخل اسم متجرك")}
                defaultValue=""
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Numéro de téléphone", "رقم الهاتف")}</Label>
              <Input 
                type="tel"
                placeholder="+213 XX XXX XXXX"
                defaultValue=""
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Email", "البريد الإلكتروني")}</Label>
              <Input 
                type="email"
                placeholder="shop@example.com"
                defaultValue=""
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Adresse", "العنوان")}</Label>
              <Input 
                placeholder={translate("Adresse de la boutique", "عنوان المتجر")}
                defaultValue=""
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{translate("Description", "الوصف")}</Label>
            <Textarea 
              placeholder={translate("Décrivez votre boutique...", "صف متجرك...")}
              rows={3}
            />
          </div>
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
            {translate("Enregistrer les informations", "حفظ المعلومات")}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{translate("Apparence", "المظهر")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{translate("Mode sombre", "الوضع الداكن")}</p>
              <p className="text-sm text-muted-foreground">
                {translate("Activer le mode sombre pour l'interface", "تفعيل الوضع الداكن للواجهة")}
              </p>
            </div>
            <Button
              variant={isDarkMode ? "default" : "outline"}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? translate("Activé", "مفعل") : translate("Désactivé", "معطل")}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{translate("Langue", "اللغة")}</p>
              <p className="text-sm text-muted-foreground">
                {translate("Choisir la langue de l'interface", "اختر لغة الواجهة")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === "fr" ? "default" : "outline"}
                onClick={() => setLanguage("fr")}
                size="sm"
              >
                Français
              </Button>
              <Button
                variant={language === "ar" ? "default" : "outline"}
                onClick={() => setLanguage("ar")}
                size="sm"
              >
                العربية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horaires & Capacité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {translate("Horaires & Capacité", "المواعيد والقدرة")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              { key: 'sunday', label: { fr: 'Dimanche', ar: 'الأحد' }, isWeekend: false },
              { key: 'monday', label: { fr: 'Lundi', ar: 'الإثنين' }, isWeekend: false },
              { key: 'tuesday', label: { fr: 'Mardi', ar: 'الثلاثاء' }, isWeekend: false },
              { key: 'wednesday', label: { fr: 'Mercredi', ar: 'الأربعاء' }, isWeekend: false },
              { key: 'thursday', label: { fr: 'Jeudi', ar: 'الخميس' }, isWeekend: false },
              { key: 'friday', label: { fr: 'Vendredi', ar: 'الجمعة' }, isWeekend: true },
              { key: 'saturday', label: { fr: 'Samedi', ar: 'السبت' }, isWeekend: true },
            ].map((day) => (
              <DayHoursInput
                key={day.key}
                dayKey={day.key}
                dayLabel={day.label}
                isWeekend={day.isWeekend}
                translate={translate}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Receipt Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {translate("Paramètres des reçus", "إعدادات الإيصالات")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{translate("Message de pied de page", "رسالة التذييل")}</Label>
            <Input 
              placeholder={translate("Merci pour votre achat!", "شكراً لتسوقكم!")}
              defaultValue=""
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{translate("Impression automatique", "الطباعة التلقائية")}</p>
              <p className="text-sm text-muted-foreground">
                {translate("Imprimer automatiquement après chaque vente", "طباعة تلقائية بعد كل عملية بيع")}
              </p>
            </div>
            <Button variant="outline">
              {translate("Désactivé", "معطل")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System status (Electron modules) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {translate("Statut du système", "حالة النظام")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {healthError && (
            <p className="text-red-500">
              {translate("Impossible de charger l'état du système", "تعذر تحميل حالة النظام")}: {healthError}
            </p>
          )}
          {!health && !healthError && (
            <p className="text-muted-foreground">
              {translate("Chargement de l'état du système…", "جارٍ تحميل حالة النظام…")}
            </p>
          )}
          {health && (
            <>
              <p className="text-muted-foreground">
                {translate("Environnement", "بيئة التشغيل")}:{" "}
                {health.env?.isDev
                  ? translate("Développement", "بيئة تطوير")
                  : translate("Production", "بيئة إنتاج")}{" "}
                · {health.env?.platform} · v{health.env?.appVersion}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{translate("Base de données hors ligne", "قاعدة البيانات بدون اتصال")}</span>
                  <span className={health.modules?.offlineDb ? "text-emerald-500" : "text-red-500"}>
                    {moduleLabel(health.modules?.offlineDb)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{translate("Service de synchronisation", "خدمة المزامنة")}</span>
                  <span className={health.modules?.syncService ? "text-emerald-500" : "text-amber-500"}>
                    {moduleLabel(health.modules?.syncService)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{translate("Lecteur codes-barres", "قارئ الباركود")}</span>
                  <span className={health.modules?.barcodeScanner ? "text-emerald-500" : "text-amber-500"}>
                    {moduleLabel(health.modules?.barcodeScanner)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{translate("Mises à jour automatiques", "التحديثات التلقائية")}</span>
                  <span className={health.modules?.autoUpdater ? "text-emerald-500" : "text-amber-500"}>
                    {moduleLabel(health.modules?.autoUpdater)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{translate("RFID", "RFID")}</span>
                  <span className={health.modules?.rfidStore ? "text-emerald-500" : "text-amber-500"}>
                    {moduleLabel(health.modules?.rfidStore)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
