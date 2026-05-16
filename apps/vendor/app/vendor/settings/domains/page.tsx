"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { VendorSecuritySettingsPanel } from "../../../../components/security/VendorSecuritySettingsPanel"
import { StoreDomainsSection } from "../../../../components/security/StoreDomainsSection"

export default function VendorDomainsPage() {
  const { data } = useSession()
  const vendorId = (data?.user?.id as string | undefined) ?? null
  const translate = useMemo(() => (fr: string, ar: string) => fr, [])

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Domaines</h1>
        <p className="text-sm text-muted-foreground">
          Sous-domaine vendeur, domaine personnalisé et domaines par magasin.
        </p>
      </header>
      <VendorSecuritySettingsPanel translate={translate} managedVendorId={vendorId} />
      <StoreDomainsSection vendorId={vendorId} translate={translate} />
    </main>
  )
}
