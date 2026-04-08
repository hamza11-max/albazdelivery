/**
 * Flow token embeds store context when the business sends the Flow (recommended).
 * Use encodeFlowToken when triggering a Flow via Cloud API template / message.
 */
export type FlowTokenPayload = {
  storeId: string
}

/** True only in a real Node.js process — not in a webpack browser bundle where Buffer is polyfilled. */
function isRealNodeJs(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    typeof process.versions.node === 'string'
  )
}

function toBase64Url(json: string): string {
  if (isRealNodeJs()) {
    // Native Node.js Buffer supports base64url
    return Buffer.from(json, 'utf8').toString('base64url')
  }
  // Browser-safe: manual base64 → base64url conversion
  const base64 = typeof btoa !== 'undefined'
    ? btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    : Buffer.from(json).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(flowToken: string): string {
  const pad = flowToken.length % 4 === 0 ? '' : '='.repeat(4 - (flowToken.length % 4))
  const b64 = flowToken.replace(/-/g, '+').replace(/_/g, '/') + pad
  if (isRealNodeJs()) {
    return Buffer.from(b64, 'base64').toString('utf8')
  }
  // Browser-safe atob decode
  return typeof atob !== 'undefined'
    ? decodeURIComponent(atob(b64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    : Buffer.from(b64, 'base64').toString('utf8')
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
