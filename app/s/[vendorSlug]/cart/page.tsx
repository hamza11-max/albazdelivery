import { notFound } from 'next/navigation'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { CartView } from './CartView'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ vendorSlug: string }>
}

export default async function CartPage({ params }: PageProps) {
  const { vendorSlug } = await params
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-900">Your cart</h1>
      <CartView
        accent={tenant.vendor.storefrontAccentColor || '#0f172a'}
        vendorName={tenant.vendor.name}
      />
    </div>
  )
}
