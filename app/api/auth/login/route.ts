import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { loginSchema } from '@/lib/validations/auth'
import { signIn } from '@/lib/auth'

// POST /api/auth/login - Simple login endpoint for API testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = loginSchema.parse(body)
    const { email, password } = validated
    
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
      },
    })
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }
    
    // Check if approved
    if (user.status !== 'APPROVED') {
      throw new UnauthorizedError('Your account is pending approval')
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password)
    
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password')
    }
    
    // Return user data (without password)
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
