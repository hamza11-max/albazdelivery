import crypto from 'crypto'

/** Verifies Meta `X-Hub-Signature-256` for webhook or Flow endpoint requests. */
export function verifyMetaHubSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=') || !appSecret) {
    return false
  }
  const sig = signatureHeader.slice('sha256='.length)
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}
