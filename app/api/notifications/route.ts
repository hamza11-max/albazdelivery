import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { markNotificationReadSchema } from '@/lib/validations/api'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')

    // Validate pagination parameters
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)
    const page = Math.max(1, parseInt(pageParam || '1'))

    // Build where clause
    const where: any = {
      recipientId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: session.user.id,
        isRead: false,
      },
    })

    return successResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = markNotificationReadSchema.parse(body)
    const { notificationId, markAllAsRead } = validatedData

    if (markAllAsRead) {
      // Mark all notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          recipientId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return successResponse({
        message: `Marked ${result.count} notifications as read`,
        count: result.count,
      })
    }

    if (!notificationId) {
      return errorResponse(new Error('notificationId is required when markAllAsRead is false'), 400)
    }

    // Validate notificationId format
    try {
      z.string().cuid().parse(notificationId)
    } catch {
      return errorResponse(new Error('Invalid notification ID format'), 400)
    }

    // Mark single notification as read
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new NotFoundError('Notification')
    }

    // Verify user owns this notification
    if (notification.recipientId !== session.user.id) {
      throw new UnauthorizedError('You can only mark your own notifications as read')
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return successResponse({ notification: updatedNotification })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/notifications - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'

    if (deleteAll) {
      // Delete all read notifications
      const result = await prisma.notification.deleteMany({
        where: {
          recipientId: session.user.id,
          isRead: true,
        },
      })

      return successResponse({
        message: `Deleted ${result.count} notifications`,
        count: result.count,
      })
    }

    if (!notificationId) {
      return errorResponse(new Error('notificationId or all=true is required'), 400)
    }

    // Validate notificationId format
    try {
      z.string().cuid().parse(notificationId)
    } catch {
      return errorResponse(new Error('Invalid notification ID format'), 400)
    }

    // Verify ownership before deleting
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new NotFoundError('Notification')
    }

    if (notification.recipientId !== session.user.id) {
      throw new UnauthorizedError('You can only delete your own notifications')
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    })

    return successResponse({
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}
