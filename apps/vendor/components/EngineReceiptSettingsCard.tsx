"use client"

import { useEffect, useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Switch } from "@/root/components/ui/switch"
import type { SalesSettings, ShopInfo } from "../electron/shared/ipc"
import { engine } from "../lib/engine"

type T = (fr: string, ar: string) => string
type Receipt = SalesSettings["receipt"]

const selectClass = "h-9 w-full rounded-md border bg-background px-2 text-sm"

/**
 * Desktop app: the thermal receipt printed by the engine (Arabic rendered as an image, ESC/POS).
 * Header comes from the shop; printer, paper, language and drawer from the engine's sales settings.
 */
export function EngineReceiptSettingsCard({ translate: t }: { translate: T }) {
  const [settings, setSettings] = useState<SalesSettings | null>(null)
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [printers, setPrinters] = useState<{ name: string; displayName: string }[]>([])
  const [preview, setPreview] = useState("")
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    engine("settings:sales").then(setSettings).catch((e) => setMessage({ ok: false, text: String(e?.message ?? e) }))
    engine("shop:get").then(setShop).catch(() => {})
    engine("print:printers").then(setPrinters).catch(() => setPrinters([]))
  }, [])

  const receipt = settings?.receipt
  const lang = receipt?.lang
  const paper = receipt?.paper
  // A sample receipt in the chosen language and width, rendered exactly as it will print.
  useEffect(() => {
    if (!lang || !paper) return
    engine("print:preview", { lang, paper }).then((p) => setPreview(p.dataUrl)).catch(() => setPreview(""))
  }, [lang, paper])

  const run = async (fn: () => Promise<string>) => {
    setBusy(true)
    setMessage(null)
    try {
      setMessage({ ok: true, text: await fn() })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }
  const setReceipt = (patch: Partial<Receipt>) => settings && setSettings({ ...settings, receipt: { ...settings.receipt, ...patch } })

  if (!settings || !receipt || !shop) return null
  return (
    <Card data-testid="engine-receipt-settings">
      <CardHeader>
        <CardTitle>{t("Ticket de caisse (imprimante thermique)", "وصل الصندوق (طابعة حرارية)")}</CardTitle>
        <CardDescription>
          {t("Arabe et français corrects sur toute imprimante ESC/POS 58 ou 80 mm. « Image » est recommandé.", "عربية وفرنسية صحيحة على كل طابعة ESC/POS ‏58 أو 80 مم. « صورة » هو الموصى به.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("Nom sur le ticket", "الاسم على الوصل")}</Label>
              <Input value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("Téléphone", "الهاتف")}</Label>
              <Input value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t("Adresse", "العنوان")}</Label>
              <Input value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t("Message en bas du ticket", "رسالة أسفل الوصل")}</Label>
              <Input value={shop.receiptFooter} onChange={(e) => setShop({ ...shop, receiptFooter: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("Imprimante", "الطابعة")}</Label>
              <select className={selectClass} value={receipt.printer} onChange={(e) => setReceipt({ printer: e.target.value })} data-testid="receipt-printer">
                <option value="">{t("Aucune (pas d'impression)", "لا شيء (بدون طباعة)")}</option>
                {printers.map((p) => <option key={p.name} value={p.name}>{p.displayName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("Papier", "الورق")}</Label>
              <select className={selectClass} value={receipt.paper} onChange={(e) => setReceipt({ paper: Number(e.target.value) as 58 | 80 })}>
                <option value={80}>80 mm</option>
                <option value={58}>58 mm</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("Langue", "اللغة")}</Label>
              <select className={selectClass} value={receipt.lang} onChange={(e) => setReceipt({ lang: e.target.value as Receipt["lang"] })}>
                <option value="mixed">{t("Arabe + français", "عربي + فرنسي")}</option>
                <option value="ar">{t("Arabe", "عربي")}</option>
                <option value="fr">{t("Français", "فرنسي")}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("Mode", "الطريقة")}</Label>
              <select className={selectClass} value={receipt.route} onChange={(e) => setReceipt({ route: e.target.value as Receipt["route"] })}>
                <option value="raster">{t("Image ESC/POS (recommandé)", "صورة ESC/POS (موصى به)")}</option>
                <option value="driver">{t("Pilote Windows", "تعريف ويندوز")}</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={receipt.autoPrint} onCheckedChange={(v) => setReceipt({ autoPrint: v })} />{t("Imprimer après chaque vente", "الطباعة بعد كل بيع")}</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={receipt.openDrawer} onCheckedChange={(v) => setReceipt({ openDrawer: v })} />{t("Ouvrir le tiroir (espèces)", "فتح الدرج (نقد)")}</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => run(async () => {
              setShop(await engine("shop:save", shop))
              setSettings(await engine("settings:saveSales", settings))
              return t("Enregistré", "تم الحفظ")
            })}>{t("Enregistrer", "حفظ")}</Button>
            <Button variant="outline" disabled={busy || !receipt.printer} onClick={() => run(async () => {
              if (receipt.route === "raster") await engine("print:raster", { options: { lang: receipt.lang, paper: receipt.paper }, target: { kind: "windows", printer: receipt.printer }, openDrawer: false })
              else await engine("print:driver", { options: { lang: receipt.lang, paper: receipt.paper }, printer: receipt.printer })
              return t("Ticket d'essai envoyé", "تم إرسال وصل تجريبي")
            })}>{t("Imprimer un essai", "طباعة تجريبية")}</Button>
            <Button variant="outline" disabled={busy || !receipt.printer} onClick={() => run(async () => {
              await engine("print:drawer", { target: { kind: "windows", printer: receipt.printer } })
              return t("Tiroir ouvert", "تم فتح الدرج")
            })}>{t("Ouvrir le tiroir", "فتح الدرج")}</Button>
          </div>
          {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`} role="status">{message.text}</p>}
        </div>
        {preview && (
          <div className="justify-self-center">
            <p className="mb-1 text-xs text-muted-foreground">{t("Aperçu (exemple)", "معاينة (مثال)")}</p>
            <img src={preview} alt="" className="max-h-[420px] border bg-white" style={{ width: receipt.paper === 80 ? 288 : 192, imageRendering: "pixelated" }} data-testid="receipt-preview" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
