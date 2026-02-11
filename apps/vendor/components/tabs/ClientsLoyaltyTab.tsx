"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { Users, Gift } from "lucide-react"
import type { Customer } from "@/root/lib/types"
import { CustomersTab } from "./CustomersTab"
import { LoyaltyTab } from "./LoyaltyTab"

interface ClientsLoyaltyTabProps {
  customers: Customer[]
  translate: (fr: string, ar: string) => string
  setShowCustomerDialog: (show: boolean) => void
}

export function ClientsLoyaltyTab({ customers, translate, setShowCustomerDialog }: ClientsLoyaltyTabProps) {
  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Clients & Fidélité", "العملاء والولاء")}</h2>
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {translate("Clients", "العملاء")}
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {translate("Fidélité", "الولاء")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="space-y-4 mt-4">
          <CustomersTab customers={customers} translate={translate} setShowCustomerDialog={setShowCustomerDialog} />
        </TabsContent>
        <TabsContent value="loyalty" className="space-y-4 mt-4">
          <LoyaltyTab translate={translate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
