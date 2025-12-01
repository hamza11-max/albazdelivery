import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { algerianPhoneRegex } from '@/root/lib/validations/auth'

// POST /api/auth/check-status - Check user status by identifier (for login error handling)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier } = body

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      )
    }

    const trimmedIdentifier = identifier.trim()
    const isPhoneLogin = algerianPhoneRegex.test(trimmedIdentifier)
    const normalizedIdentifier = isPhoneLogin ? trimmedIdentifier : trimmedIdentifier.toLowerCase()

    // Find user (only check status, don't expose other data)
    const user = await prisma.user.findUnique({
      where: isPhoneLogin ? { phone: normalizedIdentifier } : { email: normalizedIdentifier },
      select: {
        status: true,
      },
    })

    if (!user) {
      // Don't reveal if user exists or not - return generic response
      return NextResponse.json(
        { status: null },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { status: user.status },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Check Status API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

