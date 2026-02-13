import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { auth } from '@/root/lib/auth'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import crypto from 'crypto'

function hashPasskey(passkey: string) {
  return crypto.createHash('sha256').update(passkey).digest('hex')
}

function normalizePasskey(passkey: string) {
  const raw = String(passkey || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return raw.match(/.{1,4}/g)?.join('-') || raw
}

function generatePasskey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(16)
  let out = ''
  for (let i = 0; i < 16; i += 1) {
    out += chars[bytes[i] % chars.length]
  }
  return out.match(/.{1,4}/g)?.join('-') || out
}

export async function POST(request: NextRequest) {
  try {
    try {
      await applyRateLimit(request, rateLimitConfigs.api)
    } catch (rateLimitError) {
      console.warn('[subscription-passkeys] Rate limit check failed:', rateLimitError)
    }

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can generate passkeys')
    }

    const body = await request.json()
    const { subscriptionId, vendorEmail, expiresInDays = 7 } = body || {}

    let targetSubscriptionId = subscriptionId
    if (!targetSubscriptionId && vendorEmail) {
      const user = await prisma.user.findUnique({
        where: { email: String(vendorEmail).toLowerCase().trim() },
        select: { id: true },
      })
      if (!user) {
        throw new NotFoundError('Vendor user')
      }
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!subscription) {
        throw new NotFoundError('Subscription')
      }
      targetSubscriptionId = subscription.id
    }

    if (!targetSubscriptionId) {
      return errorResponse(new Error('subscriptionId or vendorEmail is required'), 400)
    }

    const passkey = normalizePasskey(generatePasskey())
    const passkeyHash = hashPasskey(passkey)
    const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000) : null

    await prisma.subscriptionPasskey.create({
      data: {
        subscriptionId: targetSubscriptionId,
        passkeyHash,
        expiresAt: expiresAt || undefined,
        createdBy: session.user.id,
      },
    })

    return successResponse({
      subscriptionId: targetSubscriptionId,
      passkey,
      expiresAt,
    })
  } catch (error) {
    console.error('[subscription-passkeys] POST error:', error)
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    try {
      await applyRateLimit(request, rateLimitConfigs.api)
    } catch (rateLimitError) {
      console.warn('[subscription-passkeys] Rate limit check failed:', rateLimitError)
    }

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view passkeys')
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const passkeys = await prisma.subscriptionPasskey.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? limit : 50,
      include: {
        subscription: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    })

    return successResponse({
      passkeys: passkeys.map((item) => ({
        id: item.id,
        subscriptionId: item.subscriptionId,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
        usedAt: item.usedAt,
        createdBy: item.createdBy,
        vendor: item.subscription?.user || null,
      })),
    })
  } catch (error) {
    console.error('[subscription-passkeys] GET error:', error)
    return errorResponse(error)
  }
}
