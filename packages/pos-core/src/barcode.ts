/**
 * EAN-13 helpers. Shops scan the manufacturer's barcode when there is one and
 * print their own when there is not; own codes use the GS1 "in-store" prefix
 * 200–299, which never collides with real products.
 */

/** Check digit for the first 12 digits of an EAN-13. */
export function ean13CheckDigit(first12: string): number {
  if (!/^\d{12}$/.test(first12)) throw new Error('EAN-13 body must be 12 digits')
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10
}

export function isValidEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12])
}

/** In-store EAN-13 from a per-shop counter: "2" + 2-digit shop prefix + 9-digit sequence + check digit. */
export function inStoreEan13(sequence: number, shopPrefix = 0): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999_999_999) throw new Error('sequence out of range')
  if (!Number.isInteger(shopPrefix) || shopPrefix < 0 || shopPrefix > 99) throw new Error('shopPrefix out of range')
  const body = `2${String(shopPrefix).padStart(2, '0')}${String(sequence).padStart(9, '0')}`
  return body + ean13CheckDigit(body)
}

/** True for codes this shop could have printed itself (prefix 2xx). */
export function isInStoreCode(code: string): boolean {
  return isValidEan13(code) && code.startsWith('2')
}

/**
 * Normalises what a scanner or a person typed: trims, drops spaces, and
 * rejects control characters. Returns null for anything that cannot be a code.
 */
export function normaliseCode(raw: string): string | null {
  const code = raw.trim().replace(/\s+/g, '')
  // eslint-disable-next-line no-control-regex
  if (code.length === 0 || code.length > 48 || /[\u0000-\u001f]/.test(code)) return null
  return code
}
