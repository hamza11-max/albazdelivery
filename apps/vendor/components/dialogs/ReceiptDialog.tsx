"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/root/components/ui/dialog"
import { Badge } from "@/root/components/ui/badge"
import type { Sale } from "@/root/lib/types"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lastSale: Sale | null
  translate: (fr: string, ar: string) => string
}

export function ReceiptDialog({
  open,
  onOpenChange,
  lastSale,
  translate,
}: ReceiptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("Reçu de Vente", "إيصال البيع")}</DialogTitle>
          <DialogDescription>
            {translate("Détails de la transaction complétée", "تفاصيل المعاملة المكتملة")}
          </DialogDescription>
        </DialogHeader>
        {lastSale && (
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h3 className="text-lg font-semibold">{translate("ALBAZ", "الباز")}</h3>
              <p className="text-sm text-muted-foreground">
                {translate("Date", "التاريخ")}: {new Date(lastSale.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {translate("Numéro", "الرقم")}: {lastSale.id.slice(0, 8)}
              </p>
              
              {/* Barcode for Order */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  {translate("Code-barres", "رمز شريطي")}
                </p>
                <div className="bg-white p-2 rounded border border-gray-300 inline-block">
                  <img
                    src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(lastSale.id)}&code=Code128&dpi=96&dataseparator=`}
                    alt={translate("Code-barres", "رمز شريطي")}
                    className="h-12 w-auto max-w-full"
                  />
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {lastSale.id}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">{translate("Articles", "العناصر")}:</h4>
              {lastSale.items.map((item, index) => {
                const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0
                const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 0
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.productName} x{quantity}
                    </span>
                    <span>{(price * quantity).toFixed(2)} {translate("DZD", "دج")}</span>
                  </div>
                )
              })}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>{translate("Sous-total", "المجموع الفرعي")}:</span>
                <span>{lastSale.subtotal.toFixed(2)} {translate("DZD", "دج")}</span>
              </div>
              {lastSale.discount > 0 && (
                <div className="flex justify-between">
                  <span>{translate("Remise", "الخصم")}:</span>
                  <span>-{lastSale.discount.toFixed(2)} {translate("DZD", "دج")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>{translate("Total", "المجموع")}:</span>
                <span>{lastSale.total.toFixed(2)} {translate("DZD", "دج")}</span>
              </div>
              <div className="mt-2">
                <Badge variant={lastSale.paymentMethod === "cash" ? "default" : "secondary"}>
                  {lastSale.paymentMethod === "cash" ? translate("Espèces", "نقد") : translate("Carte", "بطاقة")}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
