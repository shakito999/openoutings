"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  getNotificationLink,
  getNotificationIcon,
  type NotificationWithDetails,
} from '@/lib/notifications'
import { supabase } from '@/lib/supabaseClient'

type FilterType = 'all' | 'unread'

export default function NotificationsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [markingAllRead, setMarkingAllRead] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (!userId) return

    loadNotifications()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      setNotifications((prev) => [newNotification as NotificationWithDetails, ...prev])
    })

    return unsubscribe
  }, [userId, filter])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserId(user.id)
  }

  async function loadNotifications() {
    if (!userId) return
    setLoading(true)
    const data = await getUserNotifications(userId, {
      unreadOnly: filter === 'unread',
    })
    setNotifications(data)
    setLoading(false)
  }

  async function handleNotificationClick(notification: NotificationWithDetails) {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
    }

    // Navigate to the notification link
    const link = getNotificationLink(notification)
    router.push(link)
  }

  async function handleMarkAllRead() {
    if (!userId) return
    setMarkingAllRead(true)
    const success = await markAllAsRead(userId)
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
    setMarkingAllRead(false)
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (diffInDays === 1) {
      return 'Вчера ' + date.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('bg-BG', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    } else {
      return date.toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Известия
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0
              ? `Имате ${unreadCount} непрочетени известия`
              : 'Всички известия са прочетени'}
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Всички
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Непрочетени {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
              >
                {markingAllRead ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Обработва се...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Маркирай всички като прочетени</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-12 w-12 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="text-8xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {filter === 'unread' ? 'Няма непрочетени известия' : 'Няма известия'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'unread'
                ? 'Всички известия са прочетени'
                : 'Ще получите известия, когато има нови актуализации'}
            </p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30"
            >
              Разгледай събития
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all ${
                  !notification.is_read
                    ? 'border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                    : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 text-4xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
