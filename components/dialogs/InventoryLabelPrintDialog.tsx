"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Printer, ScanLine, Search, Loader2 } from "lucide-react"
import type { InventoryProduct } from "@/root/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Checkbox } from "@/root/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/root/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/root/components/ui/select"
import { BarcodeScannerDialog } from "./BarcodeScannerDialog"
import { useProductBarcodeScanner } from "@/hooks/useProductBarcodeScanner"
import { createOfflineCode128DataUri } from "@/root/lib/barcode"

const DEFAULT_PRINTER_VALUE = "__default_printer__"

export type LabelFieldKey = "name" | "sku" | "category" | "costPrice" | "sellingPrice" | "barcodeImage"

export type InventoryLabelType = "barcode" | "rfid" | "both"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function printHtmlInHiddenFrame(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  const cleanup = () => {
    URL.revokeObjectURL(url)
    iframe.remove()
  }
  const runPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } finally {
      setTimeout(cleanup, 60_000)
    }
  }
  iframe.onload = () => {
    const doc = iframe.contentDocument
    const imgs = doc?.querySelectorAll("img") ?? []
    let pending = 0
    const tryPrint = () => {
      pending--
      if (pending <= 0) runPrint()
    }
    imgs.forEach((img) => {
      if (!img.complete) {
        pending++
        img.addEventListener("load", tryPrint, { once: true })
        img.addEventListener("error", tryPrint, { once: true })
      }
    })
    if (pending === 0) runPrint()
  }
  document.body.appendChild(iframe)
  iframe.src = url
}

function buildLabelDocument(
  product: InventoryProduct,
  fields: Record<LabelFieldKey, boolean>,
  labelType: InventoryLabelType,
  copies: number
): string {
  const barcodeData = (product.barcode?.trim() || product.sku || "").trim()
  const wantsBarcode =
    (labelType === "barcode" || labelType === "both") && fields.barcodeImage && Boolean(barcodeData)
  const showRfidBlock = labelType === "rfid" || labelType === "both"

  if ((labelType === "barcode" || labelType === "both") && fields.barcodeImage && !barcodeData) {
    throw new Error("MISSING_BARCODE_DATA")
  }

  const lines: string[] = []
  if (fields.name) {
    lines.push(`<div class="line name">${escapeHtml(product.name)}</div>`)
  }
  if (fields.sku) {
    lines.push(`<div class="line muted">SKU: ${escapeHtml(product.sku)}</div>`)
  }
  if (fields.category && product.category) {
    lines.push(`<div class="line muted">${escapeHtml(product.category)}</div>`)
  }
  if (fields.costPrice) {
    lines.push(`<div class="line small">${escapeHtml(String(product.costPrice))} DZD</div>`)
  }
  if (fields.sellingPrice) {
    lines.push(`<div class="line price">${escapeHtml(String(product.sellingPrice))} DZD</div>`)
  }

  let barcodeSection = ""
  if (wantsBarcode) {
    const imgUrl = createOfflineCode128DataUri(barcodeData)
    barcodeSection = `
      <div class="barcode-wrap">
        <img src="${imgUrl}" alt="" class="barcode-img" />
        <div class="barcode-num">${escapeHtml(barcodeData)}</div>
      </div>`
  }

  let rfidSection = ""
  if (showRfidBlock) {
    const epc = escapeHtml(barcodeData || product.sku)
    rfidSection = `
      <div class="rfid-block">
        <div class="rfid-title">RFID</div>
        <div class="rfid-epc">EPC / UID suggéré: ${epc}</div>
        <div class="rfid-hint">À encoder sur la puce (station RFID).</div>
      </div>`
  }

  const labelInner = `
    <div class="label-inner">
      ${lines.join("")}
      ${barcodeSection}
      ${rfidSection}
    </div>`

  const styles = `
    @page { size: 50mm 30mm; margin: 2mm; }
    @media print {
      body { margin: 0; padding: 0; }
      .sheet { page-break-after: always; }
      .sheet:last-child { page-break-after: auto; }
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 4mm;
      font-size: 8pt;
    }
    .sheet {
      width: 46mm;
      min-height: 26mm;
      box-sizing: border-box;
      margin: 0 auto 4mm;
      border: 1px dashed #ccc;
      padding: 2mm;
    }
    .label-inner { text-align: center; }
    .line { margin-bottom: 1mm; word-break: break-word; }
    .line.name { font-weight: bold; font-size: 9pt; }
    .line.muted { font-size: 7pt; color: #333; }
    .line.small { font-size: 7pt; }
    .line.price { font-weight: bold; font-size: 9pt; }
    .barcode-wrap { margin-top: 1mm; }
    .barcode-img { max-width: 100%; height: auto; max-height: 14mm; }
    .barcode-num { font-family: monospace; font-size: 6pt; margin-top: 0.5mm; }
    .rfid-block {
      margin-top: 2mm;
      padding: 1.5mm;
      border: 1px solid #333;
      text-align: left;
      font-size: 6pt;
    }
    .rfid-title { font-weight: bold; margin-bottom: 0.5mm; }
    .rfid-epc { font-family: monospace; word-break: break-all; }
    .rfid-hint { margin-top: 0.5mm; color: #555; font-size: 5.5pt; }
  `

  const blocks: string[] = []
  for (let i = 0; i < copies; i++) {
    blocks.push(`<div class="sheet">${labelInner}</div>`)
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Label — ${escapeHtml(product.name)}</title>
  <style>${styles}</style>
</head>
<body>
${blocks.join("")}
</body>
</html>`
}

interface InventoryLabelPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: InventoryProduct[]
  translate: (fr: string, ar: string) => string
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  isElectronRuntime: boolean
  isArabic?: boolean
}

export function InventoryLabelPrintDialog({
  open,
  onOpenChange,
  products,
  translate,
  toast,
  isElectronRuntime,
  isArabic = false,
}: InventoryLabelPrintDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [printers, setPrinters] = useState<{ name: string; displayName: string; isDefault?: boolean }[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState(DEFAULT_PRINTER_VALUE)
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [copies, setCopies] = useState(1)
  const [labelType, setLabelType] = useState<InventoryLabelType>("both")
  const [fields, setFields] = useState<Record<LabelFieldKey, boolean>>({
    name: true,
    sku: true,
    category: false,
    costPrice: false,
    sellingPrice: true,
    barcodeImage: true,
  })
  const [rfidTagLookup, setRfidTagLookup] = useState("")
  const [rfidLookupLoading, setRfidLookupLoading] = useState(false)

  const { videoRef: barcodeVideoRef, error: barcodeScannerError } = useProductBarcodeScanner({
    isOpen: scannerOpen,
    onBarcodeScanned: (code) => {
      setSearchQuery(code)
      matchProductByScan(code)
      setScannerOpen(false)
    },
    onError: (err) => console.error("[LabelPrint] scanner:", err),
  })

  const matchProductByScan = useCallback(
    (code: string) => {
      const trimmed = code.trim()
      if (!trimmed) return
      const found =
        products.find((p) => (p.barcode && p.barcode.trim() === trimmed) || p.sku === trimmed) ||
        products.find(
          (p) =>
            p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            p.sku.toLowerCase().includes(trimmed.toLowerCase())
        )
      if (found) {
        setSelectedProduct(found)
        toast({
          title: translate("Produit sélectionné", "تم اختيار المنتج"),
          description: found.name,
        })
      } else {
        setSelectedProduct(null)
        toast({
          variant: "destructive",
          title: translate("Introuvable", "غير موجود"),
          description: translate(
            "Aucun produit ne correspond à ce code.",
            "لا يوجد منتج يطابق هذا الرمز."
          ),
        })
      }
    },
    [products, toast, translate]
  )

  useEffect(() => {
    if (!open) return
    setLoadingPrinters(true)
    const run = async () => {
      try {
        const list = await window.electronAPI?.print?.getPrinters?.()
        if (Array.isArray(list) && list.length > 0) {
          setPrinters(list.map((p) => ({ name: p.name, displayName: p.displayName, isDefault: p.isDefault })))
          // Keep system dialog as the default behavior.
          // Selecting a specific printer explicitly switches to silent/direct print.
          setSelectedPrinter(DEFAULT_PRINTER_VALUE)
        } else {
          setPrinters([])
          setSelectedPrinter(DEFAULT_PRINTER_VALUE)
        }
      } catch {
        setPrinters([])
        setSelectedPrinter(DEFAULT_PRINTER_VALUE)
      } finally {
        setLoadingPrinters(false)
      }
    }
    void run()
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSelectedProduct(null)
      setScannerOpen(false)
      setRfidTagLookup("")
      setCopies(1)
    }
  }, [open])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return products.slice(0, 12)
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
      .slice(0, 12)
  }, [products, searchQuery])

  const toggleField = (key: LabelFieldKey, checked: boolean) => {
    setFields((f) => ({ ...f, [key]: checked }))
  }

  const handleRfidTagLookup = async () => {
    const tag = rfidTagLookup.trim()
    if (!tag) return
    if (!isElectronRuntime || !window.electronAPI?.offline?.getProductByRfidTag) {
      toast({
        variant: "destructive",
        title: translate("RFID indisponible", "تعذّر استخدام RFID"),
        description: translate(
          "La résolution par tag RFID nécessite l’app Electron.",
          "البحث بالوسم يتطلب تطبيق إلكترون."
        ),
      })
      return
    }
    setRfidLookupLoading(true)
    try {
      const offline = await window.electronAPI.offline.getProductByRfidTag(tag)
      if (!offline) {
        setSelectedProduct(null)
        toast({
          variant: "destructive",
          title: translate("Tag inconnu", "وسم غير معروف"),
          description: translate("Aucun produit lié à ce tag.", "لا يوجد منتج مرتبط بهذا الوسم."),
        })
        return
      }
      const found =
        products.find((p) => p.sku === offline.sku) ||
        products.find((p) => String(p.id) === String(offline.id))
      if (found) {
        setSelectedProduct(found)
        toast({
          title: translate("Produit sélectionné", "تم اختيار المنتج"),
          description: found.name,
        })
      } else {
        setSelectedProduct(null)
        toast({
          variant: "destructive",
          title: translate("Hors inventaire", "غير موجود في المخزون"),
          description: translate(
            "Le produit lié au tag n’est pas dans la liste affichée.",
            "المنتج المرتبط بالوسم غير موجود في القائمة الحالية."
          ),
        })
      }
    } finally {
      setRfidLookupLoading(false)
    }
  }

  const handlePrint = () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: translate("Choisissez un produit", "اختر منتجاً"),
        description: translate(
          "Recherchez ou scannez un article d’abord.",
          "ابحث أو امسح منتجاً أولاً."
        ),
      })
      return
    }
    const barcodeData = (selectedProduct.barcode?.trim() || selectedProduct.sku || "").trim()
    const hasText =
      (fields.name && selectedProduct.name) ||
      fields.sku ||
      (fields.category && selectedProduct.category) ||
      fields.costPrice ||
      fields.sellingPrice
    const hasBarcodeVisual =
      (labelType === "barcode" || labelType === "both") && fields.barcodeImage && Boolean(barcodeData)
    const hasRfidSection = labelType === "rfid" || labelType === "both"
    if (!hasText && !hasBarcodeVisual && !hasRfidSection) {
      toast({
        variant: "destructive",
        title: translate("Contenu vide", "محتوى فارغ"),
        description: translate(
          "Cochez au moins un champ, le code-barres, ou un type incluant RFID.",
          "فعّل حقلاً واحداً على الأقل أو الباركود أو نوعاً يتضمن RFID."
        ),
      })
      return
    }
    if ((labelType === "barcode" || labelType === "both") && fields.barcodeImage && !barcodeData) {
      toast({
        variant: "destructive",
        title: translate("Code-barres requis", "الرمز الشريطي مطلوب"),
        description: translate(
          "Ce produit n’a pas de code-barres ni SKU utilisable pour l’image.",
          "لا يوجد باركود أو SKU لرسم الصورة."
        ),
      })
      return
    }
    if (labelType === "barcode" && !hasBarcodeVisual && !hasText) {
      toast({
        variant: "destructive",
        title: translate("Contenu vide", "محتوى فارغ"),
        description: translate(
          "Pour une étiquette code-barres seule, activez l’image ou des lignes de texte.",
          "لملصق باركود فقط، فعّل الصورة أو أسطر النص."
        ),
      })
      return
    }
    const n = Math.min(999, Math.max(1, Math.floor(copies) || 1))
    const print = async () => {
      const html = buildLabelDocument(selectedProduct, fields, labelType, n)
      if (isElectronRuntime && window.electronAPI?.print?.printHtml) {
        const useSystemDialog = selectedPrinter === DEFAULT_PRINTER_VALUE
        const deviceName = useSystemDialog ? undefined : selectedPrinter
        const result = await window.electronAPI.print.printHtml({
          html,
          silent: !useSystemDialog,
          deviceName,
          widthMicrons: 50000,
          heightMicrons: 30000,
        })
        if (!result?.success) {
          toast({
            variant: "destructive",
            title: translate("Échec de l'impression", "فشلت الطباعة"),
            description: result?.error || translate("Impossible d'envoyer l'impression à la machine.", "تعذّر إرسال مهمة الطباعة إلى الطابعة."),
          })
          return
        }
        if (useSystemDialog) {
          toast({
            title: translate("Boîte d’impression ouverte", "تم فتح نافذة الطباعة"),
            description: translate(
              "La boîte de dialogue système est ouverte. Choisissez votre imprimante puis validez.",
              "تم فتح نافذة الطباعة. اختر الطابعة ثم أكّد."
            ),
          })
          return
        }
        const selectedPrinterLabel =
          printers.find((p) => p.name === selectedPrinter)?.displayName ?? selectedPrinter
        toast({
          title: translate("Impression envoyée", "تم إرسال الطباعة"),
          description: translate(
            `Étiquette envoyée à : ${selectedPrinterLabel}.`,
            `تم إرسال الملصق إلى: ${selectedPrinterLabel}.`
          ),
        })
        return
      } else {
        printHtmlInHiddenFrame(html)
      }
      const printerHint =
        selectedPrinter !== DEFAULT_PRINTER_VALUE
          ? translate(
              `Dans la boîte d’impression, choisissez : ${printers.find((p) => p.name === selectedPrinter)?.displayName ?? selectedPrinter}.`,
              `في نافذة الطباعة اختر الطابعة المناسبة.`
            )
          : translate(
              "Choisissez votre imprimante dans la boîte de dialogue.",
              "اختر الطابعة من نافذة الطباعة."
            )
      toast({
        title: translate("Impression", "طباعة"),
        description: printerHint,
      })
    }
    print().catch((e) => {
      if (e instanceof Error && e.message === "MISSING_BARCODE_DATA") {
        toast({
          variant: "destructive",
          title: translate("Code-barres requis", "الرمز الشريطي مطلوب"),
          description: translate(
            "Ajoutez un code-barres ou un SKU pour ce produit, ou choisissez le type RFID seul.",
            "أضف باركود أو رمز SKU لهذا المنتج، أو اختر نوع وسوم RFID فقط."
          ),
        })
        return
      }
      console.error(e)
      toast({
        variant: "destructive",
        title: translate("Erreur", "خطأ"),
        description: translate("Impossible de préparer l’étiquette.", "تعذّر تجهيز الملصق."),
      })
    })
  }

  const fieldRows: { key: LabelFieldKey; fr: string; ar: string }[] = [
    { key: "name", fr: "Nom", ar: "الاسم" },
    { key: "sku", fr: "SKU", ar: "رمز SKU" },
    { key: "category", fr: "Catégorie", ar: "الفئة" },
    { key: "costPrice", fr: "Prix d’achat", ar: "سعر الشراء" },
    { key: "sellingPrice", fr: "Prix de vente", ar: "سعر البيع" },
    { key: "barcodeImage", fr: "Image code-barres", ar: "صورة الباركود" },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              {translate("Impression d’étiquettes", "طباعة الملصقات")}
            </DialogTitle>
            <DialogDescription>
              {translate(
                "Recherchez un produit, choisissez le contenu de l’étiquette et le nombre de copies.",
                "ابحث عن منتج، واختر محتوى الملصق وعدد النسخ."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{translate("Imprimante", "الطابعة")}</Label>
              {loadingPrinters ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {translate("Chargement…", "جاري التحميل…")}
                </div>
              ) : printers.length > 0 ? (
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger>
                    <SelectValue placeholder={translate("Choisir", "اختر")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_PRINTER_VALUE}>
                      {translate("Par défaut (boîte de dialogue)", "افتراضي (نافذة النظام)")}
                    </SelectItem>
                    {printers.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.displayName || p.name}
                        {p.isDefault ? ` (${translate("défaut", "افتراضي")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {translate(
                    "Imprimante système (navigateur / dialogue d’impression). Les imprimantes listées apparaissent dans l’app Electron.",
                    "طابعة النظام (المتصفح). قائمة الطابعات تظهر في تطبيق إلكترون."
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{translate("Recherche rapide", "بحث سريع")}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground start-2" />
                  <Input
                    className={isArabic ? "ps-2 pe-9" : "ps-9 pe-2"}
                    placeholder={translate("Nom, SKU, code-barres…", "اسم، SKU، باركود…")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredProducts.length === 1) {
                        setSelectedProduct(filteredProducts[0]!)
                      }
                    }}
                  />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)} title={translate("Scanner", "مسح")}>
                  <ScanLine className="w-4 h-4" />
                </Button>
              </div>
              {searchQuery.trim() && (
                <ul className="max-h-36 overflow-y-auto rounded-md border border-border text-sm">
                  {filteredProducts.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-start px-3 py-2 hover:bg-muted/80 border-b border-border last:border-0"
                        onClick={() => setSelectedProduct(p)}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ms-2 font-mono text-xs">{p.sku}</span>
                      </button>
                    </li>
                  ))}
                  {filteredProducts.length === 0 && (
                    <li className="px-3 py-2 text-muted-foreground">
                      {translate("Aucun résultat", "لا نتائج")}
                    </li>
                  )}
                </ul>
              )}
            </div>

            {isElectronRuntime && (
              <div className="space-y-2 rounded-md border border-dashed p-3">
                <Label>{translate("Recherche par tag RFID", "بحث بوسم RFID")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={translate("ID du tag", "معرّف الوسم")}
                    value={rfidTagLookup}
                    onChange={(e) => setRfidTagLookup(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleRfidTagLookup()}
                  />
                  <Button type="button" variant="secondary" disabled={rfidLookupLoading} onClick={() => void handleRfidTagLookup()}>
                    {rfidLookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : translate("Chercher", "بحث")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {translate(
                    "Astuce : un lecteur en mode clavier peut saisir le tag dans le champ de recherche ci-dessus.",
                    "تلميح: يمكن للقارئ بوضع لوحة المفاتيح إدخال الوسم في حقل البحث."
                  )}
                </p>
              </div>
            )}

            {selectedProduct && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                <div className="font-semibold">{selectedProduct.name}</div>
                <div className="text-muted-foreground font-mono text-xs mt-1">
                  SKU: {selectedProduct.sku}
                  {selectedProduct.barcode ? ` · ${selectedProduct.barcode}` : ""}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{translate("Afficher sur l’étiquette", "عرض على الملصق")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {fieldRows.map(({ key, fr, ar }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={fields[key]}
                      onCheckedChange={(v) => toggleField(key, v === true)}
                    />
                    <span>{translate(fr, ar)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{translate("Type d’étiquette", "نوع الملصق")}</Label>
              <RadioGroup value={labelType} onValueChange={(v) => setLabelType(v as InventoryLabelType)} className="gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="barcode" id="lt-barcode" />
                  <span>{translate("Code-barres (visuel)", "باركود (مرئي)")}</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="rfid" id="lt-rfid" />
                  <span>{translate("RFID (bloc d’encodage)", "RFID (كتلة للترميز)")}</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="both" id="lt-both" />
                  <span>{translate("Les deux", "كلاهما")}</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-copies">{translate("Nombre d’étiquettes", "عدد الملصقات")}</Label>
              <Input
                id="label-copies"
                type="number"
                min={1}
                max={999}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("Fermer", "إغلاق")}
            </Button>
            <Button onClick={handlePrint} disabled={!selectedProduct}>
              <Printer className={`w-4 h-4 ${isArabic ? "ms-2" : "me-2"}`} />
              {translate("Imprimer", "طباعة")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        videoRef={barcodeVideoRef}
        error={barcodeScannerError}
        translate={translate}
      />
    </>
  )
}
