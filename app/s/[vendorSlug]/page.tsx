import { notFound } from 'next/navigation'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { getVendorCatalog } from '@/lib/storefront/catalog'
import { ProductCard } from './_storefront/ProductCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ vendorSlug: string }>
}

export default async function StorefrontHome({ params }: PageProps) {
  const { vendorSlug } = await params
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) notFound()

  const catalog = await getVendorCatalog(tenant.vendor.id)
  const accent = tenant.vendor.storefrontAccentColor || '#0f172a'

  return (
    <div>
      {/* Hero */}
      <section
        className="relative border-b border-slate-200"
        style={{
          backgroundImage: tenant.vendor.storefrontHeroUrl
            ? `linear-gradient(to bottom, rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url(${tenant.vendor.storefrontHeroUrl})`
            : `linear-gradient(135deg, ${accent}22, ${accent}0a)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
          <h1
            className={`text-3xl font-bold md:text-4xl ${
              tenant.vendor.storefrontHeroUrl ? 'text-white' : 'text-slate-900'
            }`}
          >
            {tenant.vendor.name}
          </h1>
          <p
            className={`mt-2 max-w-2xl text-sm md:text-base ${
              tenant.vendor.storefrontHeroUrl
                ? 'text-white/90'
                : 'text-slate-600'
            }`}
          >
            {tenant.vendor.storefrontTagline ||
              `Order from ${tenant.vendor.name} with fast local delivery.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span
              className={`rounded-full px-3 py-1 ${
                tenant.vendor.storefrontHeroUrl
                  ? 'bg-white/15 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`}
            >
              {catalog.stores.length} store
              {catalog.stores.length === 1 ? '' : 's'}
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                tenant.vendor.storefrontHeroUrl
                  ? 'bg-white/15 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`}
            >
              {catalog.totalProducts} product
              {catalog.totalProducts === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        {catalog.stores.length === 0 ? (
          <EmptyCatalog />
        ) : (
          catalog.stores.map((store) => (
            <div key={store.id} className="mb-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {store.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {[store.type, store.city, store.deliveryTime]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>

              {store.products.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No products available yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {store.products.map((p) => (
                    <ProductCard key={p.id} product={p} accent={accent} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}

function EmptyCatalog() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <h2 className="text-base font-semibold text-slate-900">
        Storefront coming soon
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        This vendor hasn&apos;t added products yet. Check back shortly.
      </p>
    </div>
  )
}
