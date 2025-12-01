import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true,
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is vendor or admin
    if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Vendor or Admin role required.' },
        { status: 403 }
      )
    }

    // Check if approved
    if (user.status !== 'APPROVED' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Account not approved yet' },
        { status: 403 }
      )
    }

    // Generate JWT token for Electron
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret'
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        vendorId: user.vendorProfile?.id,
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
        vendorId: user.vendorProfile?.id,
        businessName: user.vendorProfile?.businessName,
      },
      token,
    })
  } catch (error) {
    console.error('[Electron Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

