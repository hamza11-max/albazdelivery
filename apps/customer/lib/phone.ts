/**
 * Normalize Algerian phone to format expected by API: 0[567]xxxxxxxx
 * Accepts: +213555000000, 213555000000, 0555000000
 */
export function normalizeAlgerianPhone(phone: string | undefined | null): string {
  if (!phone || typeof phone !== 'string') return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 9 && /^[567]/.test(digits)) {
    return '0' + digits
  }
  if (digits.length === 10 && digits.startsWith('0') && /^0[567]/.test(digits)) {
    return digits
  }
  if (digits.length === 12 && digits.startsWith('213')) {
    return '0' + digits.slice(3)
  }
  if (digits.length === 11 && digits.startsWith('213')) {
    return '0' + digits.slice(3)
  }
  return phone
}
