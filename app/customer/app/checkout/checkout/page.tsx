export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation'
import { CheckoutPage } from './client';

async function fetchOrder(orderId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/orders/${orderId}`, {
    cache: 'no-store',
    next: { revalidate: 0 },
  })

  if (!res.ok) return null
  const data = await res.json()
  return data?.data?.order || data?.order || null
}

export default async function Page({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const orderId = (searchParams.orderId as string) || ''
  if (!orderId) {
    notFound()
  }

  const order = await fetchOrder(orderId)
  if (!order) {
    notFound()
  }

  const normalizedOrder = {
    id: order.id,
    items: order.items?.map((item: any) => ({
      id: item.id,
      name: item.product?.name || item.name || 'Article',
      price: item.price,
      quantity: item.quantity,
    })) || [],
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    customerEmail: order.customer?.email || undefined,
    notes: order.deliveryNotes || '',
    status: order.status,
  }

  return <CheckoutPage order={normalizedOrder} />;
}