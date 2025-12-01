"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Plus, Truck } from "lucide-react"
import type { Supplier } from "@/root/lib/types"

interface SuppliersTabProps {
  suppliers: Supplier[]
  translate: (fr: string, ar: string) => string
  setShowSupplierDialog: (show: boolean) => void
}

export function SuppliersTab({
  suppliers,
  translate,
  setShowSupplierDialog,
}: SuppliersTabProps) {
  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{translate("Gestion des Fournisseurs", "إدارة الموردين")}</h2>
        <Button onClick={() => setShowSupplierDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {translate("Ajouter un Fournisseur", "إضافة مورد")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {translate("Contact", "جهة الاتصال")}: {supplier.contactPerson}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">{translate("Tél", "هاتف")}:</span>
                      <span>{supplier.phone}</span>
                    </p>
                    {supplier.email && (
                      <p className="flex items-center gap-2">
                        <span className="text-muted-foreground">{translate("Email", "البريد")}:</span>
                        <span>{supplier.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {translate("Aucun fournisseur enregistré", "لا يوجد موردون مسجلون")}
            </p>
            <Button onClick={() => setShowSupplierDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {translate("Ajouter votre premier fournisseur", "أضف أول مورد لك")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
