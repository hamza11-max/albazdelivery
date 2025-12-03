import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { getMessagesSchema } from '@/lib/validations/api'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversationId')
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')

    // Validate query parameters
    const validatedData = getMessagesSchema.parse({
      conversationId: conversationId || undefined,
      limit: limitParam ? parseInt(limitParam) : undefined,
      page: pageParam ? parseInt(pageParam) : undefined,
    })
    const { conversationId: validatedConversationId, limit } = validatedData

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validatedConversationId,
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
        conversationId: validatedConversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    // Get messages with pagination
    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { conversationId: validatedConversationId },
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
          createdAt: 'desc',
        },
        take: limit,
        skip: (validatedData.page - 1) * limit,
      }),
      prisma.chatMessage.count({
        where: { conversationId: validatedConversationId },
      }),
    ])

    // Reverse to show oldest first
    messages.reverse()

    return successResponse({
      messages,
      pagination: {
        page: validatedData.page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] Error fetching messages:', error)
    return errorResponse(error)
  }
}
