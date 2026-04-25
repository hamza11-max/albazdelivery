import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { fetchStorefrontOrder } from '@/lib/storefront/orders'
import { formatPrice } from '@/lib/utils/formatting'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ vendorSlug: string; id: string }>
  searchParams: Promise<{ t?: string }>
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: PageProps) {
  const [{ vendorSlug, id }, { t: token }] = await Promise.all([
    params,
    searchParams,
  ])
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) notFound()

  if (!token) notFound()

  const order = await fetchStorefrontOrder({
    vendorId: tenant.vendor.id,
    orderId: id,
    token,
  })
  if (!order) notFound()

  const accent = tenant.vendor.storefrontAccentColor || '#0f172a'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div
        className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        role="status"
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Order confirmed
          </h1>
          <p className="text-sm text-slate-600">
            Thanks for ordering from {tenant.vendor.name}. Order reference{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">
              {order.id}
            </code>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <dl className="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
            <dt>Status</dt>
            <dd className="text-right font-medium text-slate-900">
              {order.status}
            </dd>
            <dt>Payment</dt>
            <dd className="text-right font-medium text-slate-900">
              {order.paymentMethod}
            </dd>
            <dt>Delivery to</dt>
            <dd className="text-right text-slate-900">
              {order.deliveryAddress}, {order.city}
            </dd>
            <dt>Contact</dt>
            <dd className="text-right text-slate-900">
              {order.customerPhone}
            </dd>
          </dl>
        </div>

        <ul className="divide-y divide-slate-200">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 p-4 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {item.product?.name || 'Item'}
                </p>
                <p className="text-xs text-slate-500">
                  {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {formatPrice(item.price * item.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-1 border-t border-slate-200 p-4 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          <Row label="Delivery" value={formatPrice(order.deliveryFee)} />
          <Row
            label="Total"
            value={formatPrice(order.total)}
            emphasize
          />
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Back to store
        </Link>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        emphasize ? 'pt-2 text-base font-semibold text-slate-900' : 'text-slate-600'
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
