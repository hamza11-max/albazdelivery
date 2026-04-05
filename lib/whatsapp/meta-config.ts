/**
 * Albaz WhatsApp Cloud integration — environment variables:
 *
 * - WHATSAPP_VERIFY_TOKEN — string you set in Meta webhook + Flow endpoint whitelist
 * - WHATSAPP_APP_SECRET — Meta app secret (HMAC verification)
 * - WHATSAPP_FLOW_PRIVATE_KEY — RSA PEM for Flow endpoint decrypt (upload public key in Meta Business)
 *
 * Per Meta: complete Business verification, create a Cloud API app, connect each vendor WABA
 * (Embedded Signup), then map `phone_number_id` on Store via vendor dashboard.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
 * @see https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
 */
export const META_WHATSAPP_ENV = {
  VERIFY_TOKEN: 'WHATSAPP_VERIFY_TOKEN',
  APP_SECRET: 'WHATSAPP_APP_SECRET',
  FLOW_PRIVATE_KEY: 'WHATSAPP_FLOW_PRIVATE_KEY',
} as const

export function readFlowPrivateKeyFromEnv(): string | null {
  const raw = process.env.WHATSAPP_FLOW_PRIVATE_KEY
  if (!raw?.trim()) {
    return null
  }
  return raw.replace(/\\n/g, '\n')
}
