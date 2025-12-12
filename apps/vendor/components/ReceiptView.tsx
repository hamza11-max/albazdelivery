"use client"

import { Printer } from "lucide-react"
import { Button } from "@/root/components/ui/button"
import type { Sale } from "@/root/lib/types"

interface ReceiptViewProps {
  showReceipt: boolean
  completedSale: Sale | null
  user: any
  translate: (fr: string, ar: string) => string
  isElectronRuntime: boolean
  onClose: () => void
  onPrint: () => void
  shopInfo?: {
    name?: string
    phone?: string
    email?: string
    address?: string
    description?: string
    logo?: string
    cover?: string
  }
}

export function ReceiptView({
  showReceipt,
  completedSale,
  user,
  translate,
  isElectronRuntime,
  onClose,
  onPrint,
  shopInfo,
}: ReceiptViewProps) {
  if (!showReceipt || !completedSale) return null

  const userWithExtras = user as any
  const displayName = shopInfo?.name || user?.name || "ALBAZ"
  const displayPhone = shopInfo?.phone || userWithExtras?.phone
  const displayEmail = shopInfo?.email || user?.email
  const displayAddress = shopInfo?.address || userWithExtras?.address
  const displayDesc = shopInfo?.description
  const displayLogo = shopInfo?.logo

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {displayLogo ? (
              <div className="w-24 h-24 rounded-xl border flex items-center justify-center overflow-hidden bg-white">
                <img src={displayLogo} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="ALBAZ" className="h-16 w-auto" />
              </div>
            )}
          </div>
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {displayDesc || translate("Reçu de vente", "إيصال بيع")}
            </p>
          </div>

          {/* Shop Information */}
          {(displayName || displayEmail || displayPhone || displayAddress) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <div className="space-y-1 text-sm text-center">
                {displayName && (
                  <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
                )}
                {displayPhone && (
                  <p className="text-gray-600 dark:text-gray-400">{translate("Tél", "هاتف")}: {displayPhone}</p>
                )}
                {displayEmail && (
                  <p className="text-gray-600 dark:text-gray-400">{displayEmail}</p>
                )}
                {displayAddress && (
                  <p className="text-gray-600 dark:text-gray-400">{displayAddress}</p>
                )}
              </div>
            </div>
          )}

          {/* Receipt Details */}
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{translate("Date", "التاريخ")}:</span>
                <span className="font-medium">{new Date(completedSale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{translate("Numéro de vente", "رقم البيع")}:</span>
                <span className="font-medium font-mono">{completedSale.id.slice(0, 8)}</span>
              </div>
            </div>
            
            {/* Barcode for Order */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {translate("Code-barres pour remboursement", "رمز شريطي للاسترداد")}
                </p>
                <div className="bg-white p-3 rounded border border-gray-300 dark:border-gray-700">
                  <img
                    src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(completedSale.id)}&code=Code128&dpi=96&dataseparator=`}
                    alt={translate("Code-barres", "رمز شريطي")}
                    className="h-16 w-auto max-w-full"
                  />
                </div>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mt-2">
                  {completedSale.id}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-4">{translate("Articles", "العناصر")}</h2>
            <div className="space-y-3">
              {completedSale.items.map((item, index) => {
                const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0
                const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 0
                return (
                  <div key={index} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {quantity} × {price.toFixed(2)} {translate("DZD", "دج")}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {(quantity * price).toFixed(2)} {translate("DZD", "دج")}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{translate("Sous-total", "المجموع الفرعي")}:</span>
              <span className="font-medium">{completedSale.subtotal.toFixed(2)} {translate("DZD", "دج")}</span>
            </div>
            {completedSale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{translate("Remise", "الخصم")}:</span>
                <span className="font-medium text-red-600">-{completedSale.discount.toFixed(2)} {translate("DZD", "دج")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{translate("Taxe", "الضريبة")}:</span>
              <span className="font-medium">{((completedSale as any).tax || 0).toFixed(2)} {translate("DZD", "دج")}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>{translate("Total", "المجموع")}:</span>
              <span className="text-albaz-green-700 dark:text-albaz-green-300">{completedSale.total.toFixed(2)} {translate("DZD", "دج")}</span>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {translate("Merci pour votre achat!", "شكراً لتسوقكم معنا!")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {translate("Paiement", "الدفع")}: {completedSale.paymentMethod === "cash" ? translate("Espèces", "نقد") : translate("Carte", "بطاقة")}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {translate("Fermer", "إغلاق")}
            </Button>
            <Button
              onClick={onPrint}
              className="flex-1 bg-albaz-green-gradient hover:opacity-90 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              {translate("Imprimer", "طباعة")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

