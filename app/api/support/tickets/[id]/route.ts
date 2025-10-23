import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
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

    if (!ticket) {
      return errorResponse(new Error('Ticket not found'), 404)
    }

    // Authorization: Users can only view their own tickets (except admin)
    if (session.user.role !== 'ADMIN' && ticket.customerId !== session.user.id) {
      throw new ForbiddenError('You can only view your own tickets')
    }

    return successResponse({ ticket })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { status, assignedTo } = body

    // Get existing ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return errorResponse(new Error('Ticket not found'), 404)
    }

    // Authorization: Only admin can update tickets
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admin can update ticket status')
    }

    // Update ticket
    const updateData: any = {}
    if (status) {
      updateData.status = status.toUpperCase()
      if (status.toUpperCase() === 'RESOLVED' || status.toUpperCase() === 'CLOSED') {
        updateData.resolvedAt = new Date()
      }
    }
    if (assignedTo) {
      updateData.assignedTo = assignedTo
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
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

    console.log('[API] Support ticket updated:', params.id, '->', status)

    return successResponse({ ticket: updatedTicket })
  } catch (error) {
    return errorResponse(error)
  }
}
