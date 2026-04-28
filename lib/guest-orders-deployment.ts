import { ServiceUnavailableError } from './errors'

/**
 * Dine-in / QR "guest" orders persist to local JSON (see `guest-orders-store`).
 * That is not durable on Vercel serverless or multi-instance Node hosts.
 *
 * - Use the **Vendor desktop (Electron)** build for file-backed guest orders, or
 * - Set `GUEST_ORDERS_ALLOW_ON_VERCEL=1` only after storage is moved to Postgres (or similar).
 */
export function assertGuestDineInFileStorageSupported(): void {
  if (process.env.GUEST_ORDERS_DISABLE === '1') {
    throw new ServiceUnavailableError(
      'Guest dine-in orders are disabled (GUEST_ORDERS_DISABLE=1).'
    )
  }
  const allow = String(process.env.GUEST_ORDERS_ALLOW_ON_VERCEL || '')
    .trim()
    .toLowerCase()
  if (allow === '1' || allow === 'true' || allow === 'yes') {
    return
  }
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    throw new ServiceUnavailableError(
      'Guest dine-in order storage is not available in this serverless deployment. Use the AlBaz Vendor desktop app, or migrate guest orders to the database and set GUEST_ORDERS_ALLOW_ON_VERCEL=1.'
    )
  }
}
