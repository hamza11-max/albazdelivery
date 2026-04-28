import { channelsForDomain, type NotificationEventDomain } from '@/lib/notifications/channel-matrix'

/** Structured log line for observability: intended channels per matrix (in-app still created separately). */
export function logNotificationChannelPlan(
  domain: NotificationEventDomain,
  context: Record<string, unknown>
): void {
  console.info(
    JSON.stringify({
      observability: 'notification_channel_plan_v1',
      domain,
      intendedChannels: channelsForDomain(domain),
      ...context,
    })
  )
}
