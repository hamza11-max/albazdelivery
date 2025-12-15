"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Switch } from "@/root/components/ui/switch"
import { Badge } from "@/root/components/ui/badge"
import { Mail, Send, Settings, TestTube, AlertCircle, CheckCircle2 } from "lucide-react"
import { getEmailConfig, saveEmailConfig, sendEmail, type EmailConfig } from "@/utils/emailUtils"
import { useToast } from "@/hooks/use-toast"

interface EmailTabProps {
  translate: (fr: string, ar: string) => string
}

export function EmailTab({ translate }: EmailTabProps) {
  const { toast } = useToast()
  const [config, setConfig] = useState<EmailConfig>(getEmailConfig())
  const [testEmail, setTestEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    saveEmailConfig(config)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: translate("Configuration enregistrée", "تم حفظ الإعدادات"),
        description: translate("Les paramètres email ont été enregistrés", "تم حفظ إعدادات البريد الإلكتروني"),
      })
    }, 500)
  }

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: translate("Email requis", "البريد الإلكتروني مطلوب"),
        description: translate("Veuillez entrer une adresse email", "يرجى إدخال عنوان بريد إلكتروني"),
        variant: "destructive",
      })
      return
    }

    setIsSendingTest(true)
    try {
      const result = await sendEmail(
        testEmail,
        translate("Email de test - ALBAZ", "بريد إلكتروني تجريبي - ALBAZ"),
        translate(
          "Ceci est un email de test depuis votre système ALBAZ. Si vous recevez ce message, votre configuration email fonctionne correctement.",
          "هذا بريد إلكتروني تجريبي من نظام ALBAZ الخاص بك. إذا تلقيت هذه الرسالة، فإن إعدادات البريد الإلكتروني الخاصة بك تعمل بشكل صحيح."
        ),
        config
      )

      if (result.success) {
        toast({
          title: translate("Email envoyé", "تم إرسال البريد"),
          description: translate("L'email de test a été envoyé avec succès", "تم إرسال البريد الإلكتروني التجريبي بنجاح"),
        })
      } else {
        toast({
          title: translate("Erreur", "خطأ"),
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: translate("Erreur", "خطأ"),
        description: translate("Échec de l'envoi de l'email de test", "فشل إرسال البريد الإلكتروني التجريبي"),
        variant: "destructive",
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Configuration Email", "إعدادات البريد الإلكتروني")}</h2>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {translate("Paramètres SMTP", "إعدادات SMTP")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled" className="text-base">
                {translate("Activer les emails", "تفعيل البريد الإلكتروني")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {translate("Activez l'envoi d'emails pour les reçus et notifications", "تفعيل إرسال البريد الإلكتروني للإيصالات والإشعارات")}
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
            />
          </div>

          {config.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">{translate("Serveur SMTP", "خادم SMTP")} *</Label>
                  <Input
                    id="smtp-host"
                    value={config.smtpHost}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">{translate("Port", "المنفذ")} *</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={config.smtpPort}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-user">{translate("Nom d'utilisateur", "اسم المستخدم")} *</Label>
                <Input
                  id="smtp-user"
                  type="email"
                  value={config.smtpUser}
                  onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                  placeholder="votre-email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-password">{translate("Mot de passe", "كلمة المرور")} *</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={config.smtpPassword}
                  onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">{translate("Email expéditeur", "البريد الإلكتروني للمرسل")} *</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={config.fromEmail}
                    onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                    placeholder="noreply@albaz.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">{translate("Nom expéditeur", "اسم المرسل")} *</Label>
                  <Input
                    id="from-name"
                    value={config.fromName}
                    onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                    placeholder="ALBAZ Delivery"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smtp-secure">{translate("Connexion sécurisée (TLS)", "اتصال آمن (TLS)")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {translate("Utiliser TLS pour une connexion sécurisée", "استخدام TLS لاتصال آمن")}
                  </p>
                </div>
                <Switch
                  id="smtp-secure"
                  checked={config.smtpSecure}
                  onCheckedChange={(secure) => setConfig({ ...config, smtpSecure: secure })}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {translate("Note", "ملاحظة")}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {translate(
                        "Pour Gmail, vous devrez peut-être utiliser un mot de passe d'application au lieu de votre mot de passe habituel. Consultez les paramètres de votre compte Google pour créer un mot de passe d'application.",
                        "لـ Gmail، قد تحتاج إلى استخدام كلمة مرور التطبيق بدلاً من كلمة المرور العادية. راجع إعدادات حساب Google الخاص بك لإنشاء كلمة مرور التطبيق."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                {isSaving ? translate("Enregistrement...", "جاري الحفظ...") : translate("Enregistrer", "حفظ")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              {translate("Tester l'envoi d'email", "اختبار إرسال البريد")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {translate(
                "Envoyez un email de test pour vérifier que votre configuration fonctionne correctement.",
                "أرسل بريداً إلكترونياً تجريبياً للتحقق من أن إعداداتك تعمل بشكل صحيح."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder={translate("email@exemple.com", "email@exemple.com")}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTestEmail} disabled={isSendingTest || !testEmail.trim()}>
                {isSendingTest ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-pulse" />
                    {translate("Envoi...", "جاري الإرسال...")}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {translate("Envoyer un test", "إرسال تجريبي")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Features Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {translate("Fonctionnalités", "الميزات")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
              <span>{translate("Envoi automatique de reçus par email après chaque vente", "إرسال تلقائي للإيصالات عبر البريد الإلكتروني بعد كل عملية بيع")}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
              <span>{translate("Notifications par email pour les commandes importantes", "إشعارات عبر البريد الإلكتروني للطلبات المهمة")}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
              <span>{translate("Rapports périodiques par email (quotidien, hebdomadaire, mensuel)", "تقارير دورية عبر البريد الإلكتروني (يومية، أسبوعية، شهرية)")}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

