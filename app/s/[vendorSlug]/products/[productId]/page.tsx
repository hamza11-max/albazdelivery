import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { getVendorProduct } from '@/lib/storefront/catalog'
import { formatPrice } from '@/lib/utils/formatting'
import { AddToCartButton } from './AddToCartButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ vendorSlug: string; productId: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { vendorSlug, productId } = await params
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) notFound()

  const result = await getVendorProduct(tenant.vendor.id, productId)
  if (!result) notFound()

  const { product, store } = result
  const accent = tenant.vendor.storefrontAccentColor || '#0f172a'

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {store.name} · {store.deliveryTime}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {product.name}
            </h1>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatPrice(product.price)}
            </p>
            {product.description ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {product.description}
              </p>
            ) : null}
          </div>

          <div className="mt-auto pt-6">
            {product.available ? (
              <AddToCartButton
                accent={accent}
                product={{
                  productId: product.id,
                  storeId: product.storeId,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                }}
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                This product is currently unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
