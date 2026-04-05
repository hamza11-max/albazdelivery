import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { verifyMetaHubSignature } from '@/root/lib/whatsapp/verify-signature'
import { decryptFlowRequestBody, encryptFlowResponsePayload } from '@/root/lib/whatsapp/flow-crypto'
import { decodeFlowToken } from '@/root/lib/whatsapp/flow-token'
import { readFlowPrivateKeyFromEnv } from '@/root/lib/whatsapp/meta-config'

export const dynamic = 'force-dynamic'

/**
 * WhatsApp Flows **data channel** endpoint (dynamic catalog). Configure this URL in Flow JSON + Meta.
 * Returns encrypted plaintext body per Meta spec. Requires WHATSAPP_FLOW_PRIVATE_KEY (RSA PEM).
 */
export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET ?? ''
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!appSecret || !verifyMetaHubSignature(rawBody, signature, appSecret)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const privateKey = readFlowPrivateKeyFromEnv()
  if (!privateKey) {
    return new Response('Flow private key not configured', { status: 503 })
  }

  let parsed: { encrypted_aes_key?: string; encrypted_flow_data?: string; initial_vector?: string }
  try {
    parsed = JSON.parse(rawBody) as typeof parsed
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  if (!parsed.encrypted_aes_key || !parsed.encrypted_flow_data || !parsed.initial_vector) {
    return new Response('Missing encryption fields', { status: 400 })
  }

  let decryptedBody: Record<string, unknown>
  let aesKeyBuffer: Buffer
  let initialVectorBuffer: Buffer

  try {
    const dec = decryptFlowRequestBody(
      {
        encrypted_aes_key: parsed.encrypted_aes_key,
        encrypted_flow_data: parsed.encrypted_flow_data,
        initial_vector: parsed.initial_vector,
      },
      privateKey,
    )
    decryptedBody = dec.decryptedBody
    aesKeyBuffer = dec.aesKeyBuffer
    initialVectorBuffer = dec.initialVectorBuffer
  } catch (e) {
    console.error('[whatsapp-flow] decrypt failed', e)
    return new Response('Misdirected Request', { status: 421 })
  }

  const action = decryptedBody.action as string | undefined
  const flowToken = decryptedBody.flow_token as string | undefined

  if (action === 'ping') {
    const response = { data: { status: 'active' } }
    const encrypted = encryptFlowResponsePayload(response, aesKeyBuffer, initialVectorBuffer)
    return new Response(encrypted, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const tokenPayload = flowToken ? decodeFlowToken(flowToken) : null
  const storeId = tokenPayload?.storeId ?? null

  if (!storeId) {
    const err = {
      screen: 'MENU',
      data: {
        error_message:
          'Missing store context in flow_token. Encode storeId when sending the Flow (see lib/whatsapp/flow-token.ts).',
      },
    }
    const encrypted = encryptFlowResponsePayload(err, aesKeyBuffer, initialVectorBuffer)
    return new Response(encrypted, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const store = await prisma.store.findFirst({
    where: { id: storeId, isActive: true },
    select: { id: true, name: true },
  })

  if (!store) {
    const err = {
      screen: 'MENU',
      data: { error_message: 'Store not found or inactive.' },
    }
    const encrypted = encryptFlowResponsePayload(err, aesKeyBuffer, initialVectorBuffer)
    return new Response(encrypted, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const products = await prisma.product.findMany({
    where: { storeId, available: true },
    select: { id: true, name: true, price: true, description: true },
    orderBy: { name: 'asc' },
    take: 100,
  })

  const productRows = products.map((p) => ({
    id: p.id,
    title: `${p.name} — ${p.price} DZD`,
    description: (p.description || '').slice(0, 72),
  }))

  const nextResponse = {
    screen: 'MENU',
    data: {
      store_name: store.name,
      product_rows: productRows,
    },
  }

  const encrypted = encryptFlowResponsePayload(nextResponse, aesKeyBuffer, initialVectorBuffer)
  return new Response(encrypted, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
