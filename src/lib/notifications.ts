import { supabase } from './supabaseClient'

export type NotificationType =
  | 'event_joined'
  | 'event_reminder_24h'
  | 'event_reminder_1h'
  | 'event_cancelled'
  | 'event_updated'
  | 'new_follower'
  | 'new_event_from_following'

export interface Notification {
  id: number
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_event_id: number | null
  related_user_id: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationWithDetails extends Notification {
  event?: {
    id: number
    title: string
    starts_at: string
  } | null
  user?: {
    id: string
    full_name: string
    avatar_url: string | null
    username: string | null
  } | null
}

/**
 * Get notifications for the current user with related details
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    unreadOnly?: boolean
  }
): Promise<NotificationWithDetails[]> {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      event:related_event_id (
        id,
        title,
        starts_at
      ),
      user:related_user_id (
        id,
        full_name,
        avatar_url,
        username
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return (data || []) as NotificationWithDetails[]
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return count || 0
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Create a notification (typically called by backend triggers, but available for client-side use)
 */
export async function createNotification(notification: {
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_event_id?: number
  related_user_id?: string
}): Promise<boolean> {
  const { error } = await supabase.from('notifications').insert({
    user_id: notification.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    related_event_id: notification.related_event_id || null,
    related_user_id: notification.related_user_id || null,
  })

  if (error) {
    console.error('Error creating notification:', error)
    return false
  }

  return true
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get notification link based on type
 */
export function getNotificationLink(notification: NotificationWithDetails): string {
  switch (notification.type) {
    case 'event_joined':
    case 'event_reminder_24h':
    case 'event_reminder_1h':
    case 'event_cancelled':
    case 'event_updated':
      return notification.related_event_id
        ? `/events/${notification.related_event_id}`
        : '/events'
    case 'new_follower':
      return notification.related_user_id
        ? `/profile/${notification.related_user_id}`
        : '/community'
    case 'new_event_from_following':
      return notification.related_event_id
        ? `/events/${notification.related_event_id}`
        : '/events'
    default:
      return '/notifications'
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'event_joined':
      return '👥'
    case 'event_reminder_24h':
    case 'event_reminder_1h':
      return '⏰'
    case 'event_cancelled':
      return '❌'
    case 'event_updated':
      return '📝'
    case 'new_follower':
      return '👤'
    case 'new_event_from_following':
      return '🎉'
    default:
      return '🔔'
  }
}
