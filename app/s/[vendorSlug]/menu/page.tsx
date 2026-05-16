import { notFound } from 'next/navigation'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { getVendorCatalog } from '@/lib/storefront/catalog'
import { ProductCard } from '../_storefront/ProductCard'
import { CategoryFilter } from '../_storefront/CategoryFilter'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ vendorSlug: string }>
  searchParams: Promise<{
    category?: string
    search?: string
    sort?: string
  }>
}

export default async function StorefrontMenuPage({
  params,
  searchParams,
}: PageProps) {
  const [{ vendorSlug }, filters] = await Promise.all([params, searchParams])
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) notFound()

  const accent = tenant.vendor.storefrontAccentColor || '#0f172a'
  const catalog = await getVendorCatalog(tenant.vendor.id, filters)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Menu
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Browse {tenant.vendor.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Filter by category, search products, and add your favorites to cart.
        </p>
      </div>

      <CategoryFilter
        categories={catalog.categories}
        activeCategory={filters.category}
        initialSearch={filters.search}
        initialSort={filters.sort}
        accent={accent}
      />

      <div className="mt-6 space-y-8">
        {catalog.totalProducts === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <h2 className="text-sm font-semibold text-slate-900">
              No products found
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Try changing your search or category filter.
            </p>
          </div>
        ) : (
          catalog.stores.map((store) =>
            store.products.length > 0 ? (
              <section key={store.id}>
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-slate-900">
                    {store.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {[store.city, store.deliveryTime].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {store.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      accent={accent}
                    />
                  ))}
                </div>
              </section>
            ) : null
          )
        )}
      </div>
    </div>
  )
}
