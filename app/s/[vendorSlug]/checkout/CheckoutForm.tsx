'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStorefrontCart } from '../_storefront/StorefrontCartProvider'
import { formatPrice } from '@/lib/utils/formatting'

type PaymentMethod = 'CASH' | 'CARD' | 'WALLET'

interface Props {
  vendorSlug: string
  accent: string
  defaultCity: string
}

export function CheckoutForm({ vendorSlug, accent, defaultCity }: Props) {
  const router = useRouter()
  const { items, subtotal, clear } = useStorefrontCart()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: defaultCity,
    notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-sm text-slate-600">
          Your cart is empty — add some products first.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Browse products
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Please fill in your name, phone and delivery address.')
      return
    }

    setIsSubmitting(true)
    try {
      // Read CSRF token set by middleware so the public API POST passes the check.
      const csrfToken =
        typeof document !== 'undefined'
          ? document.cookie
              .split('; ')
              .find((c) => c.startsWith('__Host-csrf-token='))
              ?.split('=')[1]
          : undefined

      const res = await fetch('/api/public/storefront/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': decodeURIComponent(csrfToken) } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          vendorSlug,
          items: items.map((i) => ({
            productId: i.productId,
            storeId: i.storeId,
            quantity: i.quantity,
          })),
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            notes: form.notes.trim() || undefined,
          },
          paymentMethod,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(
          body?.error?.message || body?.error || 'Unable to place the order.'
        )
      }

      const data = await res.json()
      const orderId = data?.data?.orderId || data?.orderId
      const token = data?.data?.token || data?.token
      if (!orderId || !token) {
        throw new Error('Order created but we could not load confirmation.')
      }

      clear()
      router.push(`/orders/${orderId}?t=${encodeURIComponent(token)}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <Field
        label="Full name"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        required
        autoComplete="name"
      />
      <Field
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        placeholder="0555 123 456"
        required
        autoComplete="tel"
      />
      <Field
        label="Delivery address"
        value={form.address}
        onChange={(v) => setForm((f) => ({ ...f, address: v }))}
        required
        autoComplete="street-address"
      />
      <Field
        label="City"
        value={form.city}
        onChange={(v) => setForm((f) => ({ ...f, city: v }))}
        autoComplete="address-level2"
      />
      <Field
        label="Order notes (optional)"
        value={form.notes}
        onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
        multiline
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">
          Payment method
        </legend>
        <div className="flex flex-wrap gap-2">
          {(['CASH', 'CARD', 'WALLET'] as PaymentMethod[]).map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium ${
                paymentMethod === m
                  ? 'border-transparent text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              style={
                paymentMethod === m ? { backgroundColor: accent } : undefined
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={paymentMethod === m}
                onChange={() => setPaymentMethod(m)}
                className="sr-only"
              />
              {labelForPaymentMethod(m)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
        <span className="text-slate-600">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
        <span className="font-semibold text-slate-900">
          {formatPrice(subtotal)}
        </span>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        {isSubmitting ? 'Placing order…' : `Place order — ${formatPrice(subtotal)}`}
      </button>
    </form>
  )
}

function labelForPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'CASH':
      return 'Cash on delivery'
    case 'CARD':
      return 'Card'
    case 'WALLET':
      return 'Wallet'
  }
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  multiline,
  autoComplete,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  multiline?: boolean
  autoComplete?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        />
      )}
    </label>
  )
}
