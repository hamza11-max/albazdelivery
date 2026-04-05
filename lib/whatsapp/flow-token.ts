/**
 * Flow token embeds store context when the business sends the Flow (recommended).
 * Use encodeFlowToken when triggering a Flow via Cloud API template / message.
 */
export type FlowTokenPayload = {
  storeId: string
}

function toBase64Url(json: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8').toString('base64url')
  }
  const base64 = btoa(json)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(flowToken: string): string {
  const pad = flowToken.length % 4 === 0 ? '' : '='.repeat(4 - (flowToken.length % 4))
  const b64 = flowToken.replace(/-/g, '+').replace(/_/g, '/') + pad
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8')
  }
  return atob(b64)
}

export function encodeFlowToken(payload: FlowTokenPayload): string {
  return toBase64Url(JSON.stringify(payload))
}

export function decodeFlowToken(flowToken: string): FlowTokenPayload | null {
  try {
    const raw = fromBase64Url(flowToken)
    const parsed = JSON.parse(raw) as FlowTokenPayload
    if (parsed && typeof parsed.storeId === 'string' && parsed.storeId.length > 0) {
      return { storeId: parsed.storeId }
    }
  } catch {
    /* ignore */
  }
  return null
}
