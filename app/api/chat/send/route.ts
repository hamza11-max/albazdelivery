import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { sendMessageSchema } from '@/lib/validations/api'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)
    const { conversationId, message, attachments } = validatedData

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participantIds: {
          has: session.user.id,
        },
      },
    })

    if (!conversation) {
      return errorResponse(new Error('Conversation not found or access denied'), 404)
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
  senderRole: session.user.role as import('@prisma/client').ChatParticipantRole,
        senderName: session.user.name || '',
        message,
        attachments: attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    // Update conversation lastMessageTime
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageTime: new Date(),
      },
    })

    return successResponse({ message: chatMessage })
  } catch (error) {
    console.error('[API] Error sending message:', error)
    return errorResponse(error)
  }
}
