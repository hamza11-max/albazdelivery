/**
 * Normalize numbers from WhatsApp Cloud API (wa_id) to Algerian local format 0[567]XXXXXXXX
 * used by existing order validation.
 */
export function normalizeAlgerianPhoneFromWhatsApp(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('213')) {
    digits = `0${digits.slice(3)}`
  }
  if (digits.length === 9 && /^[567]/.test(digits)) {
    digits = `0${digits}`
  }
  return digits
}

export function isAlgerianMobileLocal(phone: string): boolean {
  return /^0[567]\d{8}$/.test(phone)
}
