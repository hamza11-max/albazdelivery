import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * Normalize a loosely-typed phone string to the Algerian local format used
 * by the existing User.phone column: `0[567]XXXXXXXX`.
 *
 * Accepts inputs like `+213555123456`, `213 555 123 456`, `0555-123-456`, etc.
 */
export function normalizeAlgerianPhoneLoose(input: string): string | null {
  if (!input) return null
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('213')) digits = `0${digits.slice(3)}`

  if (digits.length === 9 && /^[567]/.test(digits)) {
    digits = `0${digits}`
  }

  if (!/^0[567]\d{8}$/.test(digits)) return null
  return digits
}

function syntheticEmailFromPhone(localPhone: string): string {
  const core = localPhone.replace(/\D/g, '')
  return `guest_${core}@storefront.albazdelivery.local`
}

/**
 * Find or create a shadow CUSTOMER user for a guest storefront order. Mirrors
 * the WhatsApp `findOrCreateWhatsAppCustomer` pattern so guest + WhatsApp
 * customers converge on the same User row when the phone matches.
 */
export async function ensureGuestCustomerByPhone({
  phone,
  name,
}: {
  phone: string
  name?: string
}): Promise<{ id: string; phone: string; name: string }> {
  const normalized = normalizeAlgerianPhoneLoose(phone)
  if (!normalized) {
    throw new Error('Invalid Algerian phone number')
  }

  const existing = await prisma.user.findUnique({
    where: { phone: normalized },
    select: { id: true, phone: true, name: true },
  })
  if (existing) return existing

  const email = syntheticEmailFromPhone(normalized)
  const secret = process.env.AUTH_SECRET || 'storefront-dev-secret'
  const passwordHash = await bcrypt.hash(
    `${normalized}:${secret}:${Date.now()}`,
    10
  )

  const user = await prisma.user.create({
    data: {
      email,
      name: (name || 'Guest customer').trim().slice(0, 120) || 'Guest customer',
      phone: normalized,
      password: passwordHash,
      role: 'CUSTOMER',
      status: 'APPROVED',
    },
    select: { id: true, phone: true, name: true },
  })

  await prisma.loyaltyAccount.upsert({
    where: { customerId: user.id },
    create: { customerId: user.id },
    update: {},
  })

  return user
}
