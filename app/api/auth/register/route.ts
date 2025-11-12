import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { hashPassword } from '@/lib/password'
import { successResponse, errorResponse, ConflictError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Apply rate limiting for registration
    applyRateLimit(request, rateLimitConfigs.auth)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    const normalizedEmail = validatedData.email.toLowerCase().trim()
    const normalizedPhone = validatedData.phone.trim()

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: normalizedPhone },
        ],
      },
    })

    if (existingUser) {
      throw new ConflictError('User with this email or phone already exists')
    }

    // Check if registration request already exists
    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: normalizedPhone },
        ],
      },
    })

    if (existingRequest) {
      throw new ConflictError('Registration request already submitted for this email or phone')
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // For customers, auto-approve and create user directly
    if (validatedData.role === 'CUSTOMER') {
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: normalizedEmail,
          phone: normalizedPhone,
          password: hashedPassword,
          role: validatedData.role,
          status: 'APPROVED',
          address: validatedData.address,
          city: validatedData.city,
          photoUrl: validatedData.photoUrl,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      })

      // Create loyalty account for new customer
      await prisma.loyaltyAccount.create({
        data: {
          customerId: user.id,
        },
      })

      // Create wallet for new customer
      await prisma.wallet.create({
        data: {
          customerId: user.id,
        },
      })

      return successResponse(
        {
          user,
          autoApproved: true,
          message: 'Account created successfully',
        },
        201
      )
    }

    // For drivers and vendors, create registration request for admin approval
    const registrationRequest = await prisma.registrationRequest.create({
      data: {
        name: validatedData.name,
          email: normalizedEmail,
          phone: normalizedPhone,
        password: hashedPassword,
        role: validatedData.role,
        licenseNumber: validatedData.licenseNumber,
        vehicleType: validatedData.vehicleType,
        photoUrl: validatedData.photoUrl,
        shopType: validatedData.shopType,
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return successResponse(
      {
        request: registrationRequest,
        message: 'Registration request submitted successfully. Awaiting admin approval.',
      },
      201
    )
  } catch (error) {
    return errorResponse(error)
  }
}
