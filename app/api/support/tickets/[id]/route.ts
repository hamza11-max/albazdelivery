import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { updateSupportTicketSchema } from '@/lib/validations/api'
import { canAccessSupportTicketEscalation } from '@/lib/admin-roles'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const paramsResolved = await context.params
    const { id } = paramsResolved

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Validate ticket ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid ticket ID format'), 400)
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
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
      throw new NotFoundError('Support ticket')
    }

    // Customers see own tickets; admin / support see any
    if (!canAccessSupportTicketEscalation(session.user.role) && ticket.customerId !== session.user.id) {
      throw new ForbiddenError('You can only view your own tickets')
    }

    return successResponse({ ticket })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const paramsResolved = await context.params
    const { id } = paramsResolved

    // Validate ticket ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid ticket ID format'), 400)
    }

    const body = await request.json()
    const validatedData = updateSupportTicketSchema.parse(body)
    const { status, assignedTo } = validatedData

    // Get existing ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, customerId: true },
    })

    if (!ticket) {
      throw new NotFoundError('Support ticket')
    }

    // Authorization: admin or support agents can update tickets
    if (!canAccessSupportTicketEscalation(session.user.role)) {
      throw new ForbiddenError('Only staff can update support tickets')
    }

    // Validate assignedTo if provided
    if (assignedTo) {
      try {
        z.string().cuid().parse(assignedTo)
      } catch {
        return errorResponse(new Error('Invalid assignedTo ID format'), 400)
      }

      // Verify user exists and is admin or support staff
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedTo },
        select: { id: true, role: true },
      })

      if (!assignedUser || !['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(assignedUser.role)) {
        return errorResponse(new Error('Assigned user must be an admin or support staff'), 400)
      }
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
      where: { id },
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

    console.log('[API] Support ticket updated:', id, '->', status)

    return successResponse({ ticket: updatedTicket })
  } catch (error) {
    return errorResponse(error)
  }
}
