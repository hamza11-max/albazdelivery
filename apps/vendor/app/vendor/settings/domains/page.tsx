"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { VendorStorefrontWebPanel } from "../../../../components/VendorStorefrontWebPanel"

export default function VendorDomainsPage() {
  const { data } = useSession()
  const vendorId = (data?.user?.id as string | undefined) ?? null
  const translate = useMemo(() => (fr: string, _ar: string) => fr, [])

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <VendorStorefrontWebPanel translate={translate} vendorId={vendorId} />
    </main>
  )
}
