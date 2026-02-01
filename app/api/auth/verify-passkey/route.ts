import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse } from '@/root/lib/errors'
import crypto from 'crypto'

function normalizePasskey(passkey: string) {
  const raw = String(passkey || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return raw.match(/.{1,4}/g)?.join('-') || raw
}

function hashPasskey(passkey: string) {
  return crypto.createHash('sha256').update(passkey).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const passkey = normalizePasskey(body?.passkey)
    if (!passkey || passkey.length < 16) {
      return errorResponse(new Error('Invalid passkey'), 400)
    }

    if (process.env.NODE_ENV === 'development' && passkey === '0000-0000-0000-0000') {
      return successResponse({ valid: true, dev: true })
    }

    const passkeyHash = hashPasskey(passkey)
    const record = await prisma.subscriptionPasskey.findFirst({
      where: { passkeyHash },
      include: { subscription: { include: { user: true } } },
    })

    if (!record) {
      return errorResponse(new Error('Invalid passkey'), 401)
    }
    if (record.usedAt) {
      return errorResponse(new Error('Passkey already used'), 409)
    }
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
      return errorResponse(new Error('Passkey expired'), 410)
    }

    await prisma.subscriptionPasskey.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })

    return successResponse({
      valid: true,
      subscriptionId: record.subscriptionId,
      vendor: record.subscription?.user
        ? {
            id: record.subscription.user.id,
            email: record.subscription.user.email,
            name: record.subscription.user.name,
          }
        : null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
