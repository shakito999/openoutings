"use client"
import { downloadICS } from '@/lib/calendarUtils'

interface AddToCalendarButtonProps {
  event: {
    title: string
    description: string
    starts_at: string
    address?: string
    id: string
  }
}

export default function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  const handleAddToCalendar = () => {
    const eventUrl = `${window.location.origin}/events/${event.id}`
    
    downloadICS({
      title: event.title,
      description: event.description,
      startDate: new Date(event.starts_at),
      address: event.address || undefined,
      url: eventUrl
    })
  }

  return (
    <button
      onClick={handleAddToCalendar}
      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Добави в календар
    </button>
  )
}
