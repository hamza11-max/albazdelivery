import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createSupportTicketSchema } from '@/lib/validations/api'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const where: any = {}

    // Customers see their own tickets, admins see all
    if (session.user.role === 'CUSTOMER') {
      where.customerId = session.user.id
    }

    if (status) {
      // Validate status enum
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
      if (validStatuses.includes(status.toUpperCase())) {
        where.status = status.toUpperCase()
      }
    }

    if (category) {
      const validCategories = ['ORDER', 'PAYMENT', 'DELIVERY', 'ACCOUNT', 'OTHER']
      if (validCategories.includes(category.toUpperCase())) {
        where.category = category.toUpperCase()
      }
    }

    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      if (validPriorities.includes(priority.toUpperCase())) {
        where.priority = priority.toUpperCase()
      }
    }

    // Get total count and tickets with pagination
    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedToUser: {
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
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({ 
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
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
    const validatedData = createSupportTicketSchema.parse(body)
    const { subject, description, category, priority } = validatedData

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId: session.user.id,
        subject,
        description,
        category: category || 'OTHER',
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
