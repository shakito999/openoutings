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
import { useConversations } from '@/hooks/useConversations'

export default function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'alerts' | 'messages'>('alerts')
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Conversations for Messages tab
  const { conversations } = useConversations()
  const messagesUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

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
    const next = !isOpen
    setIsOpen(next)
    
    // Only mark alerts as read when opening on Alerts tab
    if (next && activeTab === 'alerts' && unreadCount > 0) {
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

  async function handleConversationClick(conv: any) {
    // Update last_read_at to now
    try {
      if (!userId) return
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conv.id)
        .eq('user_id', userId)
    } catch {}

    setIsOpen(false)
    const url = new URL(window.location.href)
    url.pathname = '/messages'
    url.searchParams.set('conversation', conv.id)
    router.push(url.toString())
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
        <div className="sm:absolute sm:right-0 sm:left-auto sm:mt-2 sm:w-96 fixed top-16 inset-x-2 w-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Известия</h3>
              {activeTab === 'alerts' ? (
                <Link href="/notifications" className="text-sm text-blue-600 dark:text-blue-400 hover:underline" onClick={() => setIsOpen(false)}>
                  Виж всички
                </Link>
              ) : (
                <Link href="/messages" className="text-sm text-blue-600 dark:text-blue-400 hover:underline" onClick={() => setIsOpen(false)}>
                  Отвори съобщения
                </Link>
              )}
            </div>
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'alerts' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setActiveTab('alerts')}
              >
                Alerts {unreadCount > 0 && (<span className="ml-2 inline-flex items-center justify-center px-1.5 min-w-[1.5rem] h-5 text-xs font-bold text-white bg-red-600 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>)}
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'messages' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setActiveTab('messages')}
              >
                Messages {messagesUnread > 0 && (<span className="ml-2 inline-flex items-center justify-center px-1.5 min-w-[1.5rem] h-5 text-xs font-bold text-white bg-blue-600 rounded-full">{messagesUnread > 99 ? '99+' : messagesUnread}</span>)}
              </button>
            </div>
          </div>

          {/* Content */}
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
            ) : activeTab === 'alerts' ? (
              notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <p className="text-gray-500 dark:text-gray-400">Нямате известия</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</p>
                        </div>
                        {!notification.is_read && (
                          <div className="flex-shrink-0"><div className="w-2 h-2 bg-blue-600 rounded-full"></div></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              // Messages tab
              conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map((conv) => {
                    const other = conv.participants.find(p => p.user_id !== userId)
                    const name = conv.type === 'event_group' ? (conv.event?.title || 'Event Chat') : (other?.profile?.full_name || other?.profile?.username || 'Unknown')
                    return (
                      <button key={conv.id} onClick={() => handleConversationClick(conv)} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
                            {conv.last_message && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">{conv.last_message.content}</p>
                            )}
                          </div>
{conv.unread_count > 0 && (
  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full min-w-[1.5rem] h-6 px-2 flex items-center justify-center flex-shrink-0">{conv.unread_count > 99 ? '99+' : conv.unread_count}</span>
)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
