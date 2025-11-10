import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
// Avoid importing Prisma namespace types directly from `@prisma/client` which
// some editor/TS-server configurations may not resolve. Use a permissive local
// type for the create payload and keep runtime behavior unchanged.
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createConversationSchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const userId = session.user.id

    // Get conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Last message
        },
      },
      orderBy: {
        lastMessageTime: 'desc',
      },
    })

    // Format response
  const formatted = conversations.map((conv: any) => ({
      id: conv.id,
      type: conv.type,
      participantIds: conv.participantIds,
      participantRoles: conv.participantRoles,
      orderId: (conv as unknown as { orderId?: string }).orderId ?? null,
      lastMessage: conv.messages[0] || null,
      lastMessageTime: conv.lastMessageTime,
      isActive: conv.isActive,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }))

    return successResponse({ conversations: formatted })
  } catch (error) {
    console.error('[API] Error fetching conversations:', error)
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
    const validatedData = createConversationSchema.parse(body)
    const { participantIds, type, relatedOrderId } = validatedData

    const currentUserId = session.user.id
    const currentUserRole = session.user.role

    // Validate that current user is included in participants
    if (!participantIds.includes(currentUserId)) {
      return errorResponse(new Error('You must include yourself as a participant'), 400)
    }

    // Get participant details
    const participants = await prisma.user.findMany({
      where: {
        id: { in: participantIds },
      },
      select: { id: true, role: true },
    })

    if (participants.length !== participantIds.length) {
      return errorResponse(new Error('One or more participants not found'), 404)
    }

    // Verify order exists if provided
    if (relatedOrderId) {
      const order = await prisma.order.findUnique({
        where: { id: relatedOrderId },
        select: { id: true },
      })
      if (!order) {
        return errorResponse(new Error('Order not found'), 404)
      }
    }

    // Check if conversation already exists
    const where: any = {
      type,
      participantIds: { hasEvery: participantIds },
    }
    if (relatedOrderId) where.orderId = relatedOrderId

    const existing = await prisma.conversation.findFirst({ where })

    if (existing) {
      return successResponse({ conversation: existing })
    }

    // Create new conversation
    const createData: any = {
      type: type as any,
      participantIds: participantIds,
      participantRoles: participants.map(p => p.role) as import('@prisma/client').ChatParticipantRole[],
    }
    if (relatedOrderId) createData.orderId = relatedOrderId

    const conversation = await prisma.conversation.create({ data: createData })

    return successResponse({ conversation }, 201)
  } catch (error) {
    console.error('[API] Error creating conversation:', error)
    return errorResponse(error)
  }
}
