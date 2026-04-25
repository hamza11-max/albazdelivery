import { notFound } from 'next/navigation'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { CheckoutForm } from './CheckoutForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ vendorSlug: string }>
}

export default async function CheckoutPage({ params }: PageProps) {
  const { vendorSlug } = await params
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-900">Checkout</h1>
      <p className="mt-1 text-sm text-slate-500">
        Complete your order from{' '}
        <span className="font-semibold text-slate-900">
          {tenant.vendor.name}
        </span>
        .
      </p>

      <CheckoutForm
        vendorSlug={vendorSlug}
        accent={tenant.vendor.storefrontAccentColor || '#0f172a'}
        defaultCity={tenant.vendor.city || ''}
      />
    </div>
  )
}
