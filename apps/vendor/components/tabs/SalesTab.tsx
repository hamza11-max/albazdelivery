"use client"

import { useState } from "react"
import { Card, CardContent } from "@/root/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Button } from "@/root/components/ui/button"
import { Receipt, FileText } from "lucide-react"
import type { Sale } from "@/root/lib/types"
import { InvoiceView } from "../InvoiceView"

interface SalesTabProps {
  sales: Sale[]
  translate: (fr: string, ar: string) => string
  user?: any
  shopInfo?: {
    name?: string
    phone?: string
    email?: string
    address?: string
    logo?: string
  }
}

export function SalesTab({
  sales,
  translate,
  user,
  shopInfo,
}: SalesTabProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)

  const handlePrintInvoice = (sale: Sale) => {
    setSelectedSale(sale)
    setShowInvoice(true)
  }

  const handleCloseInvoice = () => {
    setShowInvoice(false)
    setSelectedSale(null)
  }

  return (
    <>
      <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
        <h2 className="text-2xl font-bold">{translate("Historique des Ventes", "سجل المبيعات")}</h2>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("ID", "المعرف")}</TableHead>
                  <TableHead>{translate("Date", "التاريخ")}</TableHead>
                  <TableHead>{translate("Articles", "العناصر")}</TableHead>
                  <TableHead>{translate("Sous-total", "المجموع الفرعي")}</TableHead>
                  <TableHead>{translate("Remise", "الخصم")}</TableHead>
                  <TableHead>{translate("Total", "المجموع")}</TableHead>
                  <TableHead>{translate("Paiement", "الدفع")}</TableHead>
                  <TableHead>{translate("Actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">{sale.id.slice(0, 8)}</TableCell>
                    <TableCell>{new Date(sale.createdAt).toLocaleString("fr-FR")}</TableCell>
                    <TableCell>{sale.items.length}</TableCell>
                    <TableCell>{sale.subtotal.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                    <TableCell>{sale.discount.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                    <TableCell className="font-bold">{sale.total.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentMethod === "cash" ? "default" : "secondary"}>
                        {sale.paymentMethod === "cash" ? translate("Espèces", "نقد") : translate("Carte", "بطاقة")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintInvoice(sale)}
                        className="h-8"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {translate("Facture", "فاتورة")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sales.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  {translate("Aucune vente enregistrée", "لا توجد مبيعات مسجلة")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSale && (
        <InvoiceView
          showInvoice={showInvoice}
          sale={selectedSale}
          user={user}
          translate={translate}
          shopInfo={shopInfo}
          onClose={handleCloseInvoice}
        />
      )}
    </>
  )
}
