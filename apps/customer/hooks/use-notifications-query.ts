'use client'

import { useQuery } from '@tanstack/react-query'
import { notificationsAPI } from '../lib/api-client'

export interface CustomerNotificationRow {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  relatedOrderId?: string | null
  actionUrl?: string | null
}

export interface NotificationsListPayload {
  notifications: CustomerNotificationRow[]
  unreadCount: number
  pagination: { page: number; limit: number; total: number; pages: number }
}

export function useNotificationsQuery(enabled: boolean, userId?: string) {
  return useQuery({
    queryKey: ['notifications', 'list', userId ?? ''],
    queryFn: async () => {
      const response = await notificationsAPI.list({ limit: 50, page: 1 })
      return response.data as NotificationsListPayload
    },
    enabled,
    staleTime: 30_000,
  })
}

/** Lightweight unread count for nav badge; skips list body when possible */
export function useNotificationUnreadQuery(enabled: boolean, userId?: string) {
  return useQuery({
    queryKey: ['notifications', 'unread-meta', userId ?? ''],
    queryFn: async () => {
      const response = await notificationsAPI.list({ limit: 1, page: 1 })
      return response.data as NotificationsListPayload
    },
    enabled,
    staleTime: 45_000,
    select: (data) => data.unreadCount,
  })
}
