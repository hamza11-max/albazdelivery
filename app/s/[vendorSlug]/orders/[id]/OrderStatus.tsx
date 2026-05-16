'use client'

import { useEffect, useMemo, useState } from 'react'
import type { StorefrontOrderView } from '@/lib/storefront/orders'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  ASSIGNED: 'Assigned to driver',
  IN_DELIVERY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const STATUS_STEPS = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'IN_DELIVERY',
  'DELIVERED',
]

export function OrderStatus({
  initialOrder,
  token,
  vendorSlug,
  accent,
}: {
  initialOrder: StorefrontOrderView
  token: string
  vendorSlug: string
  accent: string
}) {
  const [order, setOrder] = useState(initialOrder)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const params = new URLSearchParams({ t: token, vendorSlug })
        const response = await fetch(`/api/orders/${order.id}?${params.toString()}`)
        if (!response.ok) return
        const body = await response.json()
        const next = body?.data?.order || body?.order
        if (!cancelled && next) {
          setOrder(next)
          setLastUpdated(new Date())
        }
      } catch {
        // Keep showing the last known status; the page refreshes again shortly.
      }
    }

    const interval = window.setInterval(refresh, 30000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [order.id, token, vendorSlug])

  const activeIndex = useMemo(() => {
    if (order.status === 'CANCELLED') return -1
    const index = STATUS_STEPS.indexOf(order.status)
    return index === -1 ? 0 : index
  }, [order.status])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Live order status
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {STATUS_LABELS[order.status] || order.status}
          </h2>
          {order.driver ? (
            <p className="mt-1 text-xs text-slate-500">
              Driver: {order.driver.name}
              {order.driver.status ? ` · ${order.driver.status}` : ''}
            </p>
          ) : null}
        </div>
        <p className="text-right text-[11px] text-slate-400">
          Refreshes every 30s
          {lastUpdated ? (
            <>
              <br />
              Updated {lastUpdated.toLocaleTimeString()}
            </>
          ) : null}
        </p>
      </div>

      <ol className="mt-4 grid grid-cols-3 gap-2 text-[11px] sm:grid-cols-6">
        {STATUS_STEPS.map((status, index) => {
          const active = index <= activeIndex
          return (
            <li
              key={status}
              className={`rounded-full border px-2 py-1 text-center font-medium ${
                active
                  ? 'text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
              style={
                active ? { backgroundColor: accent, borderColor: accent } : undefined
              }
            >
              {STATUS_LABELS[status]}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
