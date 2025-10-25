"use client"

import { useEffect, useState } from 'react'

export default function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    const dismissed = localStorage.getItem('notifPromptDismissed') === '1'
    if (Notification.permission === 'default' && !dismissed) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const request = async () => {
    try {
      const res = await Notification.requestPermission()
      if (res !== 'granted') {
        // keep prompt hidden for this session
        localStorage.setItem('notifPromptDismissed', '1')
      }
    } catch {}
    setVisible(false)
  }

  const dismiss = () => {
    localStorage.setItem('notifPromptDismissed', '1')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1000] max-w-xs p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="text-sm text-gray-800 dark:text-gray-200 mb-3">Enable notifications to get message alerts.</div>
      <div className="flex items-center gap-2">
        <button onClick={request} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Enable</button>
        <button onClick={dismiss} className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">Not now</button>
      </div>
    </div>
  )
}
