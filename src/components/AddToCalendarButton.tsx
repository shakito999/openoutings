"use client"
import { useState, useRef, useEffect } from 'react'
import { getCalendarUrl, CalendarType } from '@/lib/calendarUtils'

interface AddToCalendarButtonProps {
  event: {
    title: string
    description: string
    starts_at: string
    address?: string
    id: string
  }
}

const calendarOptions = [
  { type: 'google' as CalendarType, label: 'Google Calendar', icon: '📅' },
  { type: 'apple' as CalendarType, label: 'Apple Calendar', icon: '🍎' },
  { type: 'outlook' as CalendarType, label: 'Outlook', icon: '📧' },
  { type: 'office365' as CalendarType, label: 'Office 365', icon: '🏢' },
  { type: 'yahoo' as CalendarType, label: 'Yahoo Calendar', icon: '🟣' },
]

export default function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleCalendarClick = (type: CalendarType) => {
    const eventUrl = `${window.location.origin}/events/${event.id}`
    
    const calendarUrl = getCalendarUrl({
      title: event.title,
      description: event.description,
      startDate: new Date(event.starts_at),
      address: event.address || undefined,
      url: eventUrl
    }, type)

    window.open(calendarUrl, '_blank')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Добави в календар
        <svg 
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
          {calendarOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleCalendarClick(option.type)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
            >
              <span className="mr-3 text-xl">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
