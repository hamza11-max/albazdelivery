"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Label } from "@/root/components/ui/label"
import { Printer, RefreshCw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/root/components/ui/select"
import {
  VENDOR_PRINTER_INVOICE_KEY,
  VENDOR_PRINTER_LABEL_KEY,
  VENDOR_PRINTER_POS_KEY,
} from "../utils/printerSettings"

interface VendorPrinterSettingsCardProps {
  translate: (fr: string, ar: string) => string
  /** From vendor page (Electron shell); when false the card is not rendered */
  isElectronRuntime: boolean
}

export function VendorPrinterSettingsCard({ translate, isElectronRuntime }: VendorPrinterSettingsCardProps) {
  const [printers, setPrinters] = useState<Array<{ name: string; displayName?: string }>>([])
  const [printersLoading, setPrintersLoading] = useState(false)
  const [posPrinter, setPosPrinter] = useState("")
  const [labelPrinter, setLabelPrinter] = useState("")
  const [invoicePrinter, setInvoicePrinter] = useState("")

  const isElectron = isElectronRuntime && typeof window !== "undefined" && !!(window as any).electronAPI?.isElectron

  const refreshPrinters = useCallback(() => {
    if (typeof window === "undefined" || !isElectron) return
    const listPrinters = (window as any).electronAPI?.print?.getPrinters
    if (!listPrinters) return
    setPrintersLoading(true)
    listPrinters()
      .then((list: Array<{ name: string; displayName?: string }>) => {
        setPrinters(Array.isArray(list) ? list : [])
      })
      .catch(() => setPrinters([]))
      .finally(() => setPrintersLoading(false))
  }, [isElectron])

  useEffect(() => {
    if (typeof window === "undefined") return
    setPosPrinter(localStorage.getItem(VENDOR_PRINTER_POS_KEY) || "")
    setLabelPrinter(localStorage.getItem(VENDOR_PRINTER_LABEL_KEY) || "")
    setInvoicePrinter(localStorage.getItem(VENDOR_PRINTER_INVOICE_KEY) || "")
  }, [])

  useEffect(() => {
    refreshPrinters()
  }, [refreshPrinters])

  if (!isElectron) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          {translate("Imprimantes (application bureau)", "الطابعات (تطبيق سطح المكتب)")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {translate(
            "Tickets POS, étiquettes et factures A4. « Par défaut » : détection auto pour le ticket ou boîte de dialogue système.",
            "إيصال نقطة البيع، الملصقات، وفاتورة A4. « افتراضي »: اكتشاف تلقائي للإيصال أو حوار النظام.",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={refreshPrinters} disabled={printersLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${printersLoading ? "animate-spin" : ""}`} />
            {translate("Actualiser la liste", "تحديث القائمة")}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>{translate("Ticket / reçu POS", "إيصال نقطة البيع")}</Label>
            <Select
              value={posPrinter ? posPrinter : "__default__"}
              onValueChange={(v) => {
                const next = v === "__default__" ? "" : v
                setPosPrinter(next)
                localStorage.setItem(VENDOR_PRINTER_POS_KEY, next)
              }}
            >
              <SelectTrigger className="w-full max-w-full">
                <SelectValue placeholder={translate("Par défaut", "افتراضي")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">{translate("Par défaut (auto)", "افتراضي (تلقائي)")}</SelectItem>
                {printers.map((p) => (
                  <SelectItem key={`pos-${p.name}`} value={p.name}>
                    {p.displayName || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{translate("Étiquettes produit", "ملصقات المنتج")}</Label>
            <Select
              value={labelPrinter ? labelPrinter : "__default__"}
              onValueChange={(v) => {
                const next = v === "__default__" ? "" : v
                setLabelPrinter(next)
                localStorage.setItem(VENDOR_PRINTER_LABEL_KEY, next)
              }}
            >
              <SelectTrigger className="w-full max-w-full">
                <SelectValue placeholder={translate("Par défaut", "افتراضي")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">{translate("Par défaut (dialogue)", "افتراضي (حوار)")}</SelectItem>
                {printers.map((p) => (
                  <SelectItem key={`lab-${p.name}`} value={p.name}>
                    {p.displayName || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{translate("Facture A4", "فاتورة A4")}</Label>
            <Select
              value={invoicePrinter ? invoicePrinter : "__default__"}
              onValueChange={(v) => {
                const next = v === "__default__" ? "" : v
                setInvoicePrinter(next)
                localStorage.setItem(VENDOR_PRINTER_INVOICE_KEY, next)
              }}
            >
              <SelectTrigger className="w-full max-w-full">
                <SelectValue placeholder={translate("Par défaut", "افتراضي")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">{translate("Par défaut (dialogue)", "افتراضي (حوار)")}</SelectItem>
                {printers.map((p) => (
                  <SelectItem key={`inv-${p.name}`} value={p.name}>
                    {p.displayName || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
