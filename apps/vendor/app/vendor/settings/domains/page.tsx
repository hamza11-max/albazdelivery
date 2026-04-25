import { Suspense } from "react"
import { VendorDomainsCard } from "@/components/security/VendorDomainsCard"

export const dynamic = "force-dynamic"

export default function VendorDomainsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vitrine publique
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisissez votre sous-domaine et (optionnellement) un domaine
          personnalisé pour votre page de commande en ligne.
        </p>
      </header>

      <Suspense fallback={null}>
        <VendorDomainsCard />
      </Suspense>
    </main>
  )
}
