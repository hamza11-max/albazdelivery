import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { loginSchema, algerianPhoneRegex } from '@/lib/validations/auth'
import { auditAuthEvent } from '@/lib/security/audit-log'

// POST /api/auth/login - Simple login endpoint for API testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = loginSchema.parse(body)
    const { identifier, password } = validated
    const trimmedIdentifier = identifier.trim()
    const isPhoneLogin = algerianPhoneRegex.test(trimmedIdentifier)
    const normalizedIdentifier = isPhoneLogin ? trimmedIdentifier : trimmedIdentifier.toLowerCase()
    
    // Find user
    const user = await prisma.user.findUnique({
      where: isPhoneLogin ? { phone: normalizedIdentifier } : { email: normalizedIdentifier },
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
      await auditAuthEvent('LOGIN_FAILED', undefined, undefined, request, 'Invalid login credentials')
      throw new UnauthorizedError('Invalid email or password')
    }
    
    // Check if approved
    if (user.status !== 'APPROVED') {
      await auditAuthEvent('LOGIN_FAILED', user.id, user.role, request, 'Account pending approval')
      throw new UnauthorizedError('Your account is pending approval')
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password)
    
    if (!isValid) {
      await auditAuthEvent('LOGIN_FAILED', user.id, user.role, request, 'Invalid password')
      throw new UnauthorizedError('Invalid email or password')
    }
    
    // Log successful login
    await auditAuthEvent('LOGIN', user.id, user.role, request)
    
    // Return user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    
    return successResponse({
      user: userWithoutPassword,
      message: 'Login successful',
      note: 'For session-based auth, use the web interface at /login'
    })
  } catch (error) {
    return errorResponse(error)
  }
}
