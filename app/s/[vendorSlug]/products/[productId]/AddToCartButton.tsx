'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import {
  useStorefrontCart,
  type StorefrontCartItem,
} from '../../_storefront/StorefrontCartProvider'

interface Props {
  accent: string
  product: Omit<StorefrontCartItem, 'quantity'>
}

export function AddToCartButton({ accent, product }: Props) {
  const { addItem } = useStorefrontCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="inline-flex h-10 w-10 items-center justify-center text-slate-600 hover:text-slate-900"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span
          className="w-8 text-center text-sm font-semibold text-slate-900"
          aria-label="Quantity"
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="inline-flex h-10 w-10 items-center justify-center text-slate-600 hover:text-slate-900"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          addItem({ ...product, quantity: qty })
          router.push('/cart')
        }}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: accent }}
      >
        <ShoppingBag className="h-4 w-4" />
        Add to cart
      </button>
    </div>
  )
}
