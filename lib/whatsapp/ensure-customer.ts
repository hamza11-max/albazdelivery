import bcrypt from 'bcryptjs'
import { prisma } from '@/root/lib/prisma'
import { normalizeAlgerianPhoneFromWhatsApp, isAlgerianMobileLocal } from '@/root/lib/whatsapp/phone'

function syntheticEmailFromPhone(localPhone: string): string {
  const core = localPhone.replace(/\D/g, '')
  return `wa_${core}@whatsapp.albazdelivery.local`
}

/**
 * Ensure a shadow app User exists for WhatsApp-only customers (required for Order.customerId).
 */
export async function findOrCreateWhatsAppCustomer(waIdDigits: string, displayName = 'WhatsApp customer') {
  const phone = normalizeAlgerianPhoneFromWhatsApp(waIdDigits)
  if (!isAlgerianMobileLocal(phone)) {
    throw new Error(`Unrecognized phone format for WhatsApp id: ${waIdDigits}`)
  }

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, phone: true, name: true },
  })
  if (existing) {
    return existing
  }

  const email = syntheticEmailFromPhone(phone)
  const passwordHash = await bcrypt.hash(`${phone}:${process.env.AUTH_SECRET ?? 'dev'}:${Date.now()}`, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: displayName.slice(0, 120),
      phone,
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
