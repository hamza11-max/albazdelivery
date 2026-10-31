import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { getElectronJwtSecret } from '@/root/lib/electron-jwt-secret'
import { errorResponse } from '@/root/lib/errors'

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.auth)

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    let secret: string
    try {
      secret = getElectronJwtSecret()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Server auth secret is not configured' },
        { status: 503 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Vendor or Admin role required.' },
        { status: 403 }
      )
    }

    if (user.status !== 'APPROVED' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Account not approved yet' },
        { status: 403 }
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        vendorId: user.id,
      },
      secret,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vendorId: user.id,
        businessName: user.name,
      },
      token,
    })
  } catch (error) {
    console.error('[Electron Login] Error:', error)
    return errorResponse(error)
  }
}
