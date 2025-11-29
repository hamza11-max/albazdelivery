"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Plus, Users } from "lucide-react"
import type { Customer } from "@/root/lib/types"

interface CustomersTabProps {
  customers: Customer[]
  translate: (fr: string, ar: string) => string
  setShowCustomerDialog: (show: boolean) => void
}

export function CustomersTab({
  customers,
  translate,
  setShowCustomerDialog,
}: CustomersTabProps) {
  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{translate("Gestion des Clients", "إدارة العملاء")}</h2>
        <Button onClick={() => setShowCustomerDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {translate("Ajouter un Client", "إضافة عميل")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <Badge>{(customer as any).totalPurchases?.toFixed(2) || "0.00"} {translate("DZD", "دج")}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{customer.phone}</p>
                {customer.email && <p>{customer.email}</p>}
                {(customer as any).lastPurchaseDate && (
                  <p className="text-xs">
                    {translate("Dernier achat", "آخر شراء")}: {new Date((customer as any).lastPurchaseDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {translate("Aucun client enregistré", "لا يوجد عملاء مسجلون")}
            </p>
            <Button onClick={() => setShowCustomerDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {translate("Ajouter votre premier client", "أضف أول عميل لك")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
