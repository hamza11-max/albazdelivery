'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useStorefrontCart } from '../_storefront/StorefrontCartProvider'
import { formatPrice } from '@/lib/utils/formatting'

export function CartView({
  accent,
  vendorName,
}: {
  accent: string
  vendorName: string
}) {
  const { items, removeItem, setQuantity, subtotal, clear } =
    useStorefrontCart()

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-sm text-slate-600">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center gap-3 p-3"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {item.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatPrice(item.price)} each
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() =>
                  setQuantity(item.productId, item.quantity - 1)
                }
                className="inline-flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity(item.productId, item.quantity + 1)
                }
                className="inline-flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="w-20 text-right text-sm font-semibold text-slate-900">
              {formatPrice(item.price * item.quantity)}
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="inline-flex h-8 w-8 items-center justify-center text-slate-400 hover:text-red-500"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <span className="text-sm text-slate-600">Subtotal</span>
        <span className="text-base font-semibold text-slate-900">
          {formatPrice(subtotal)}
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={clear}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Clear cart
        </button>
        <Link
          href="/checkout"
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          Checkout at {vendorName}
        </Link>
      </div>
    </div>
  )
}
