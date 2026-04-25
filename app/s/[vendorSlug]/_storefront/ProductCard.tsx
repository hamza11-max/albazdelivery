'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useStorefrontCart } from './StorefrontCartProvider'
import { formatPrice } from '@/lib/utils/formatting'

export interface StorefrontProduct {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  image?: string | null
  available: boolean
  category?: string | null
}

export function ProductCard({
  product,
  accent,
}: {
  product: StorefrontProduct
  accent: string
}) {
  const { addItem } = useStorefrontCart()

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wide text-slate-400">
            {product.name}
          </div>
        )}
        {!product.available ? (
          <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-medium text-white">
            Out of stock
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link
          href={`/products/${product.id}`}
          className="text-sm font-semibold text-slate-900 hover:underline"
        >
          {product.name}
        </Link>
        {product.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {product.description}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {formatPrice(product.price)}
          </div>
          <button
            type="button"
            disabled={!product.available}
            onClick={() =>
              addItem({
                productId: product.id,
                storeId: product.storeId,
                name: product.name,
                price: product.price,
                image: product.image || null,
                quantity: 1,
              })
            }
            className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: accent }}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </article>
  )
}
