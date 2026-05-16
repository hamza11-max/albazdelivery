'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useStorefrontCart } from './StorefrontCartProvider'
import { formatPrice } from '@/lib/utils/formatting'

export function CartDrawer({
  open,
  onClose,
  accent,
}: {
  open: boolean
  onClose: () => void
  accent: string
}) {
  const { items, totalItems, subtotal, removeItem, setQuantity } =
    useStorefrontCart()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-base font-semibold text-slate-900">
              Your cart
            </h2>
            <span className="text-xs text-slate-500">({totalItems})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-900">
              Your cart is empty
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add products from the menu to start an order.
            </p>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 p-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatPrice(item.price)} each
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-full border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        className="flex h-7 w-7 items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-slate-200 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                Place order
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block text-center text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Review full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
