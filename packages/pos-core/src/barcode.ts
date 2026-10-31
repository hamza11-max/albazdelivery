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

// EAN-13 symbol tables (GS1 General Specifications, 5.2.1.2).
const L_CODES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const G_CODES = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const R_CODES = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
/** Which of L/G encodes each left-half digit, chosen by the first (implicit) digit. */
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

/**
 * Turns a printable code into 13 EAN digits: EAN-13 as is, UPC-A (12 digits)
 * with a leading 0 (same bars). Returns null for anything else.
 */
export function toEan13(code: string): string | null {
  if (isValidEan13(code)) return code
  if (/^\d{12}$/.test(code) && isValidEan13(`0${code}`)) return `0${code}`
  return null
}

/**
 * The 95 modules of an EAN-13 symbol as '1' (bar) / '0' (space):
 * start guard, 6 left digits, centre guard, 6 right digits, end guard.
 */
export function ean13Modules(code: string): string {
  if (!isValidEan13(code)) throw new Error(`Not a valid EAN-13: ${code}`)
  const digits = [...code].map(Number)
  const parity = PARITY[digits[0]!]!
  let out = '101'
  for (let i = 1; i <= 6; i++) out += (parity[i - 1] === 'L' ? L_CODES : G_CODES)[digits[i]!]
  out += '01010'
  for (let i = 7; i <= 12; i++) out += R_CODES[digits[i]!]
  return out + '101'
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
