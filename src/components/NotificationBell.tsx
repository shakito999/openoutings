"use client"
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  subscribeToNotifications,
  getNotificationLink,
  getNotificationIcon,
  type NotificationWithDetails,
} from '@/lib/notifications'
import { supabase } from '@/lib/supabaseClient'

export default function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (!userId) return

    loadNotifications()
    loadUnreadCount()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      setNotifications((prev) => [newNotification as NotificationWithDetails, ...prev])
      setUnreadCount((prev) => prev + 1)
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/icon.png',
        })
      }
    })

    return unsubscribe
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id || null)
  }

  async function loadNotifications() {
    if (!userId) return
    setLoading(true)
    const data = await getUserNotifications(userId, { limit: 10 })
    setNotifications(data)
    setLoading(false)
  }

  async function loadUnreadCount() {
    if (!userId) return
    const count = await getUnreadCount(userId)
    setUnreadCount(count)
  }

  async function handleBellClick() {
    setIsOpen(!isOpen)
    
    // Mark all unread notifications as read
    if (!isOpen && unreadCount > 0) {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id)
      }
      setUnreadCount(0)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
    }
  }

  async function handleNotificationClick(notification: NotificationWithDetails) {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
    }

    // Navigate to the notification link
    const link = getNotificationLink(notification)
    setIsOpen(false)
    router.push(link)
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Сега'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Преди ${minutes} мин`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Преди ${hours} ч`
    const days = Math.floor(hours / 24)
    if (days < 30) return `Преди ${days} д`
    const months = Math.floor(days / 30)
    return `Преди ${months} м`
  }

  if (!userId) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Известия
            </h3>
            <Link
              href="/notifications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Виж всички
            </Link>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
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
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <p className="text-gray-500 dark:text-gray-400">
                  Нямате известия
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.is_read
                        ? 'bg-blue-50 dark:bg-blue-900/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
