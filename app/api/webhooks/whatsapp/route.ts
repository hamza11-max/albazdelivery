import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { verifyMetaHubSignature } from '@/root/lib/whatsapp/verify-signature'
import { extractFlowRepliesFromWebhookBody } from '@/root/lib/whatsapp/extract-messages'
import { whatsAppFlowOrderResponseSchema } from '@/root/lib/whatsapp/flow-order-payload'
import { findOrCreateWhatsAppCustomer } from '@/root/lib/whatsapp/ensure-customer'
import { normalizeAlgerianPhoneFromWhatsApp, isAlgerianMobileLocal } from '@/root/lib/whatsapp/phone'
import { createOrderInternal } from '@/root/lib/orders/create-order-internal'
import { DEFAULT_DELIVERY_FEE } from '@/lib/constants'
import { META_WHATSAPP_ENV } from '@/root/lib/whatsapp/meta-config'

export const dynamic = 'force-dynamic'

/**
 * Meta Cloud API webhook — subscribe to `messages` for Flow completions (`nfm_reply`).
 */
export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? ''
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET ?? ''
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!appSecret || !verifyMetaHubSignature(rawBody, signature, appSecret)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const obj = (body as { object?: string }).object
  if (obj !== 'whatsapp_business_account') {
    return new Response('ignored', { status: 200 })
  }

  const replies = extractFlowRepliesFromWebhookBody(body)
  for (const reply of replies) {
    try {
      await prisma.whatsAppWebhookEvent.create({
        data: { messageId: reply.messageId },
      })
    } catch {
      continue
    }

    const store = await prisma.store.findFirst({
      where: { whatsappPhoneNumberId: reply.phoneNumberId },
      select: { id: true, isActive: true },
    })

    if (!store?.isActive) {
      console.warn('[whatsapp-webhook] No store for phone_number_id', reply.phoneNumberId)
      continue
    }

    let parsedPayload: ReturnType<typeof whatsAppFlowOrderResponseSchema.parse>
    try {
      const json = JSON.parse(reply.responseJson)
      parsedPayload = whatsAppFlowOrderResponseSchema.parse(json)
    } catch (e) {
      console.warn('[whatsapp-webhook] Invalid flow payload', e)
      continue
    }

    const customer = await findOrCreateWhatsAppCustomer(reply.customerWaId, reply.customerName ?? 'WhatsApp customer')
    let customerPhone = parsedPayload.customerPhone
    if (!customerPhone) {
      const normalized = normalizeAlgerianPhoneFromWhatsApp(reply.customerWaId)
      customerPhone = isAlgerianMobileLocal(normalized) ? normalized : customer.phone
    }

    const deliveryFee =
      parsedPayload.deliveryFee && parsedPayload.deliveryFee > 0
        ? parsedPayload.deliveryFee
        : DEFAULT_DELIVERY_FEE

    try {
      await createOrderInternal({
        customerId: customer.id,
        storeId: store.id,
        items: parsedPayload.items,
        deliveryFee,
        paymentMethod: parsedPayload.paymentMethod,
        deliveryAddress: parsedPayload.deliveryAddress,
        city: parsedPayload.city,
        customerPhone,
        orderSource: 'WHATSAPP',
        recomputePricing: true,
      })
    } catch (e) {
      console.error('[whatsapp-webhook] Order create failed', e)
    }
  }

  return new Response('ok', { status: 200 })
}
