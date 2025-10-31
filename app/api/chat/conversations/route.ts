import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
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
    const formatted = conversations.map((conv) => ({
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
    const { participantId, type, orderId } = body

    if (!participantId || !type) {
      return errorResponse(new Error('participantId and type are required'), 400)
    }

    const currentUserId = session.user.id
    const currentUserRole = session.user.role

    // Get participant details
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, role: true },
    })

    if (!participant) {
      return errorResponse(new Error('Participant not found'), 404)
    }

    // Check if conversation already exists
    const where: Prisma.ConversationWhereInput & Record<string, any> = {
      type,
      participantIds: { hasEvery: [currentUserId, participantId] },
    }
    if (orderId) where.orderId = orderId

    const existing = await prisma.conversation.findFirst({ where })

    if (existing) {
      return successResponse({ conversation: existing })
    }

    // Create new conversation
    const createData: Prisma.ConversationCreateInput & { orderId?: string } = {
      type: type as any,
      participantIds: [currentUserId, participantId],
      participantRoles: [currentUserRole, participant.role] as import('@prisma/client').ChatParticipantRole[],
    }
    if (orderId) createData.orderId = orderId

    const conversation = await prisma.conversation.create({ data: createData })

    return successResponse({ conversation })
  } catch (error) {
    console.error('[API] Error creating conversation:', error)
    return errorResponse(error)
  }
}
