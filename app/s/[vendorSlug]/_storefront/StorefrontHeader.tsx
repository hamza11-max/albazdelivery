'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useStorefrontCart } from './StorefrontCartProvider'

interface HeaderProps {
  vendor: {
    id: string
    name: string
    logoUrl: string | null
    tagline: string | null
    accent: string
  }
  vendorSlug: string
}

export function StorefrontHeader({ vendor }: HeaderProps) {
  const { totalItems } = useStorefrontCart()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label={`${vendor.name} home`}
        >
          {vendor.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.logoUrl}
              alt={`${vendor.name} logo`}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: vendor.accent }}
            >
              {vendor.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">
              {vendor.name}
            </div>
            {vendor.tagline ? (
              <div className="text-xs text-slate-500">{vendor.tagline}</div>
            ) : null}
          </div>
        </Link>

        <Link
          href="/cart"
          className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Cart</span>
          {totalItems > 0 ? (
            <span
              className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white"
              style={{ backgroundColor: vendor.accent }}
            >
              {totalItems}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  )
}
