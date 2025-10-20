import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const status = request.nextUrl.searchParams.get('status')

    const where: any = {}

    // Customers see their own tickets, admins see all
    if (session.user.role === 'CUSTOMER') {
      where.customerId = session.user.id
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ tickets })
  } catch (error) {
    console.error('[API] Error fetching tickets:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { subject, description, category, priority } = body

    if (!subject || !description) {
      return errorResponse(new Error('subject and description are required'), 400)
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId: session.user.id,
        subject,
        description,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return successResponse({ ticket })
  } catch (error) {
    console.error('[API] Error creating ticket:', error)
    return errorResponse(error)
  }
}
