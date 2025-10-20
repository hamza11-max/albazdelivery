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

    const conversationId = request.nextUrl.searchParams.get('conversationId')
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '50')

    if (!conversationId) {
      return errorResponse(new Error('conversationId is required'), 400)
    }

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

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    })

    return successResponse({ messages })
  } catch (error) {
    console.error('[API] Error fetching messages:', error)
    return errorResponse(error)
  }
}
